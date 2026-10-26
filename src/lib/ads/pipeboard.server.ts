/**
 * عميل Pipeboard Partner API — الموفّر الافتراضي لربط حسابات الإعلانات.
 * ثلاث خطوات من خادمنا فقط: تجهيز مستخدم لكل مساحة عمل، توليد رابط OAuth
 * للمالك، ثم نداء أدوات MCP بالنيابة عنه. مفتاح الشريك لا يغادر الخادم أبداً.
 */

import { requireProviderConnection } from "./providers";

const PARTNER_API = "https://pipeboard.co/api/v1/partners";
const MCP_HOSTS: Record<"google" | "meta", string> = {
  google: "https://google-ads.mcp.pipeboard.co/",
  meta: "https://meta-ads.mcp.pipeboard.co/",
};

export type PipeboardConfig = { apiKey: string };

let cache: { at: number; value: PipeboardConfig | null } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/** يقرأ مفتاح الشريك من طبقة مفاتيح الخادم الموحّدة. */
export async function pipeboardConfig(): Promise<PipeboardConfig | null> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.value;
  const { getSecret } = await import("../secrets.server");
  const apiKey = (await getSecret("PIPEBOARD_API_KEY")).trim();
  const value = apiKey ? { apiKey } : null;
  cache = { at: Date.now(), value };
  return value;
}

export function missingPipeboardConfigError(): Error {
  return new Error("لم يُضبط مفتاح Pipeboard بعد في مفاتيح المنصة.");
}

async function partnerCall<T>(config: PipeboardConfig, path: string, body: unknown): Promise<T> {
  requireProviderConnection("pipeboard");
  const res = await fetch(`${PARTNER_API}${path}`, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[pipeboard] ${path} [${res.status}]: ${text.slice(0, 300)}`);
    if (res.status === 401 || res.status === 403) {
      throw new Error("مفتاح Pipeboard مرفوض — راجع المفتاح في مفاتيح المنصة.");
    }
    if (res.status === 429) throw new Error("Pipeboard مشغول مؤقتاً — أعد المحاولة بعد قليل.");
    throw new Error(`تعذّر الاتصال بـ Pipeboard [${res.status}].`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

/** مستخدم Pipeboard المرتبط بمساحة العمل — معرّف خارجي ثابت لكل مساحة. */
export function pipeboardExternalUserId(workspaceId: string): string {
  return `ziad_ws_${workspaceId}`;
}

/** يجهّز حساب Pipeboard مرتبطاً بمساحة العمل (idempotent لدى الشريك). */
export async function provisionUser(
  config: PipeboardConfig,
  workspaceId: string,
): Promise<{ userId: string }> {
  const res = await partnerCall<{ user_id?: string; id?: string }>(config, "/users", {
    external_user_id: pipeboardExternalUserId(workspaceId),
  });
  const userId = res.user_id ?? res.id;
  if (!userId) throw new Error("استجابة Pipeboard بلا معرّف مستخدم.");
  return { userId };
}

/** يولّد رابط OAuth يربط حساب المالك الإعلاني عبر Pipeboard. */
export async function startOAuth(
  config: PipeboardConfig,
  pipeboardUserId: string,
  platform: "google" | "meta",
): Promise<{ url: string }> {
  const res = await partnerCall<{ url?: string; connect_url?: string; oauth_url?: string }>(
    config,
    "/oauth/start",
    { user_id: pipeboardUserId, platform: platform === "meta" ? "facebook" : "google" },
  );
  const url = res.url ?? res.connect_url ?? res.oauth_url;
  if (!url) throw new Error("استجابة Pipeboard بلا رابط ربط.");
  return { url };
}

export type McpToolResult = { content?: { type: string; text?: string }[]; isError?: boolean };

/** ينادِي أداة MCP على خادم Pipeboard بالنيابة عن مستخدم مساحة العمل. */
export async function callMcpTool(
  config: PipeboardConfig,
  platform: "google" | "meta",
  pipeboardUserId: string,
  tool: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  // Provisional transport must never execute, even if a key is supplied.
  requireProviderConnection("pipeboard");
  const res = await fetch(MCP_HOSTS[platform], {
    method: "POST",
    signal: AbortSignal.timeout(45_000),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "X-Partner-User-Id": pipeboardUserId,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method: "tools/call",
      params: { name: tool, arguments: args },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[pipeboard-mcp] ${tool} [${res.status}]: ${text.slice(0, 300)}`);
    if (res.status === 401 || res.status === 403) {
      throw new Error("انتهت صلاحية الربط أو رُفضت الصلاحية — أعد ربط الحساب.");
    }
    if (res.status === 429) throw new Error("تجاوزنا حد الطلبات المؤقت — أعد المحاولة بعد قليل.");
    throw new Error(`تعذّر تنفيذ الطلب عبر Pipeboard [${res.status}].`);
  }
  // قد يرد الخادم بـ SSE؛ نلتقط آخر حمولة JSON.
  const lastData = text
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean)
    .pop();
  const payload = lastData ?? text;
  const json = JSON.parse(payload) as { result?: McpToolResult; error?: { message?: string } };
  if (json.error) throw new Error(json.error.message ?? "رفضت المنصة الطلب.");
  const result = json.result;
  if (result?.isError) {
    const message = result.content?.map((c) => c.text ?? "").join(" ").slice(0, 300);
    throw new Error(message || "رفضت المنصة الطلب.");
  }
  const textOut = result?.content?.map((c) => c.text ?? "").join("\n") ?? "";
  try {
    return JSON.parse(textOut);
  } catch {
    return textOut;
  }
}
