// Publishes the current project files to the getziad.com Vercel project via the REST API.
// Used because the CLI fails with "User not found" for team-scoped tokens.
// Run: bun scripts/deploy-vercel.ts   (needs VERCEL_TOKEN)
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname;
const T = process.env.VERCEL_TOKEN;
if (!T) throw new Error("VERCEL_TOKEN missing");
const H = { Authorization: `Bearer ${T}` };
const pr = await (await fetch("https://api.vercel.com/v9/projects/getziad.com", { headers: H })).json();
const q = `?teamId=${pr.accountId}`;
const files = execSync("git ls-files -co --exclude-standard", { cwd: ROOT })
  .toString()
  .split("\n")
  .filter((f) => f && !f.startsWith(".vercel") && !f.startsWith("node_modules"));
const list: { file: string; sha: string; size: number }[] = [];
let i = 0;
await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (i < files.length) {
      const f = files[i++]!;
      let buf: Buffer;
      try {
        buf = readFileSync(ROOT + f);
      } catch {
        continue; // deleted file still listed
      }
      const sha = createHash("sha1").update(buf).digest("hex");
      const r = await fetch("https://api.vercel.com/v2/files" + q, {
        method: "POST",
        headers: { ...H, "x-vercel-digest": sha, "Content-Length": String(buf.length) },
        body: buf,
      });
      if (!r.ok) throw new Error(`${f} ${r.status} ${await r.text()}`);
      list.push({ file: f, sha, size: buf.length });
    }
  }),
);
console.log("uploaded", list.length);
const d = await (
  await fetch(`https://api.vercel.com/v13/deployments${q}&forceNew=1`, {
    method: "POST",
    headers: { ...H, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "getziad.com", project: pr.id, target: "production", files: list }),
  })
).json();
console.log(d.id, d.readyState, d.error?.message ?? "");
for (let k = 0; k < 50 && d.id; k++) {
  await new Promise((r) => setTimeout(r, 10_000));
  const s = await (await fetch(`https://api.vercel.com/v13/deployments/${d.id}${q}`, { headers: H })).json();
  if (["READY", "ERROR", "CANCELED"].includes(s.readyState)) {
    console.log("final", s.readyState, s.errorMessage ?? "");
    break;
  }
}
