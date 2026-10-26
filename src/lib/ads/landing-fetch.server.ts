import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { normalizeAdPage, publicIPv4 } from "./landing-pages";

export const PAGE_MAX_BYTES = 512_000;
export const PAGE_MAX_REDIRECTS = 5;
export type PageFetch = { html: string; finalUrl: string; statuses: number[] };
export async function vettedIPv4(host: string): Promise<string> {
  const endpoint = new URL("https://dns.google/resolve"); endpoint.searchParams.set("name", host); endpoint.searchParams.set("type", "A");
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(4000), redirect: "error" });
  if (!response.ok) throw new Error("DNS unavailable");
  const json = await response.json() as { Status?: number; Answer?: { type: number; data: string }[] };
  const addresses = json.Answer?.filter((a) => a.type === 1).map((a) => a.data) ?? [];
  if (json.Status !== 0 || !addresses.length || addresses.some((ip) => !publicIPv4(ip))) throw new Error("Non-public destination blocked");
  const first = addresses[0]; if (!first) throw new Error("DNS unavailable"); return first;
}
/** Pinned lookup retains the original Host/SNI; DNS cannot rebind during connection. */
export function readPinned(url: URL, ip: string, timeoutMs: number): Promise<{ status: number; location: string | null; html: string }> {
  if (!publicIPv4(ip)) throw new Error("Non-public destination blocked");
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      method: "GET", agent: false, family: 4,
      lookup: (_host, _options, callback) => callback(null, ip, 4),
      headers: { "User-Agent": "ZiadMediaBuyerAudit/1.0", Accept: "text/html", "Accept-Encoding": "identity" },
    }, (res) => {
      const status = res.statusCode ?? 0;
      if (status >= 300 && status < 400) { res.resume(); resolve({ status, location: res.headers.location ?? null, html: "" }); return; }
      if (status === 401 || status === 403 || status < 200 || status >= 300) { res.resume(); reject(new Error(`Public page unavailable (${status})`)); return; }
      if (!res.headers["content-type"]?.includes("text/html")) { res.resume(); reject(new Error("HTML page required")); return; }
      if (Number(res.headers["content-length"] ?? 0) > PAGE_MAX_BYTES) { res.destroy(); reject(new Error("Page exceeds size limit")); return; }
      const chunks: Buffer[] = []; let size = 0;
      res.on("data", (chunk: Buffer) => { size += chunk.length; if (size > PAGE_MAX_BYTES) { res.destroy(); reject(new Error("Page exceeds size limit")); } else chunks.push(chunk); });
      res.on("end", () => resolve({ status, location: null, html: Buffer.concat(chunks).toString("utf8") }));
      res.on("error", reject);
    });
    const timer = setTimeout(() => request.destroy(new Error("Page read timed out")), timeoutMs);
    request.on("close", () => clearTimeout(timer)); request.on("error", reject); request.end();
  });
}
export async function fetchAdPage(input: string, deps = { resolve: vettedIPv4, read: readPinned }): Promise<PageFetch> {
  let url = new URL(normalizeAdPage(input)); const statuses: number[] = []; const deadline = Date.now() + 15000;
  for (let redirects = 0; redirects <= PAGE_MAX_REDIRECTS; redirects++) {
    if (Date.now() >= deadline) throw new Error("Page read timed out");
    const ip = await deps.resolve(url.hostname);
    const response = await deps.read(url, ip, Math.max(1, deadline - Date.now())); statuses.push(response.status);
    if (!response.location) return { html: response.html, finalUrl: url.toString(), statuses };
    if (redirects === PAGE_MAX_REDIRECTS) throw new Error("Too many redirects");
    const next = new URL(normalizeAdPage(new URL(response.location, url).toString()));
    if (url.protocol === "https:" && next.protocol !== "https:") throw new Error("HTTPS downgrade blocked");
    url = next;
  }
  throw new Error("Too many redirects");
}