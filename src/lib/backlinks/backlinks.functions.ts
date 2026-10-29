import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BACKLINK_STATUSES, directoryById, listingConfirmsLink } from "./directories";

export type BacklinkPack = {
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  category: string;
  tags: string[];
};

const ws = { workspaceId: z.string().uuid() };

export const listBacklinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object(ws).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("backlink_submissions" as never)
      .select("*")
      .eq("workspace_id", data.workspaceId);
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as {
      id: string; directory_id: string; status: string; pack: BacklinkPack | null;
      listing_url: string | null; live_ok: boolean | null; live_checked_at: string | null;
    }[];
  });

function parsePack(raw: string, fallbackName: string): BacklinkPack {
  const match = raw.match(/\{[\s\S]*\}/);
  const obj = match ? (JSON.parse(match[0]) as Partial<BacklinkPack>) : {};
  return {
    name: String(obj.name ?? fallbackName).slice(0, 80),
    tagline: String(obj.tagline ?? "").slice(0, 120),
    shortDescription: String(obj.shortDescription ?? "").slice(0, 300),
    longDescription: String(obj.longDescription ?? "").slice(0, 1500),
    category: String(obj.category ?? "").slice(0, 60),
    tags: Array.isArray(obj.tags) ? obj.tags.map(String).slice(0, 8) : [],
  };
}

export const generateBacklinkPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ...ws, directoryId: z.string().min(2).max(60) }).parse(i))
  .handler(async ({ data, context }) => {
    const dir = directoryById(data.directoryId);
    if (!dir) throw new Error("Unknown directory");
    const { data: w, error } = await context.supabase
      .from("workspaces").select("name, website, industry, profile, use_website_context")
      .eq("id", data.workspaceId).single();
    if (error || !w) throw new Error("Workspace not found");
    if (!w.website) throw new Error("أضف رابط موقعك في إعدادات المساحة أولًا.");
    const profile = w.use_website_context ? JSON.stringify(w.profile ?? {}).slice(0, 3000) : "{}";
    const { callLovableRewrite } = await import("@/lib/post-improve.server");
    const out = await callLovableRewrite([
      {
        role: "system",
        content:
          "You are Nour, an SEO specialist preparing a directory listing. Use only facts given; never invent metrics, prices, awards or customers. Reply with one JSON object only: {name, tagline (<=60 chars), shortDescription (<=160 chars), longDescription (2-3 short paragraphs), category, tags (3-8)}. Write in English unless the business profile is clearly Arabic-only.",
      },
      {
        role: "user",
        content: `Directory: ${dir.name} (${dir.category} directory)\nBusiness: ${w.name}\nWebsite: ${w.website}\nIndustry: ${w.industry}\nProfile: ${profile}`,
      },
    ]);
    const pack = parsePack(out, w.name);
    const { error: upErr } = await context.supabase.from("backlink_submissions" as never).upsert(
      { workspace_id: data.workspaceId, directory_id: dir.id, pack, status: "ready" } as never,
      { onConflict: "workspace_id,directory_id" },
    );
    if (upErr) throw new Error(upErr.message);
    return pack;
  });

export const updateBacklink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      ...ws,
      directoryId: z.string().min(2).max(60),
      status: z.enum(BACKLINK_STATUSES).optional(),
      listingUrl: z.string().url().max(500).nullable().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    if (!directoryById(data.directoryId)) throw new Error("Unknown directory");
    // "live" is only set by the verification check, never by hand.
    const status = data.status === "live" ? "submitted" : data.status;
    const row: Record<string, unknown> = { workspace_id: data.workspaceId, directory_id: data.directoryId };
    if (status) row.status = status;
    if (data.listingUrl !== undefined) row.listing_url = data.listingUrl;
    const { error } = await context.supabase.from("backlink_submissions" as never)
      .upsert(row as never, { onConflict: "workspace_id,directory_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const verifyBacklink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ ...ws, directoryId: z.string().min(2).max(60) }).parse(i))
  .handler(async ({ data, context }) => {
    const dir = directoryById(data.directoryId);
    if (!dir) throw new Error("Unknown directory");
    const [{ data: w }, { data: sub }] = await Promise.all([
      context.supabase.from("workspaces").select("website").eq("id", data.workspaceId).single(),
      context.supabase.from("backlink_submissions" as never).select("listing_url")
        .eq("workspace_id", data.workspaceId).eq("directory_id", dir.id).maybeSingle(),
    ]);
    const listingUrl = (sub as { listing_url?: string } | null)?.listing_url;
    if (!listingUrl || !w?.website) throw new Error("أضف رابط صفحة الإدراج أولًا.");
    let ok = false;
    try {
      const res = await fetch(listingUrl, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 ZiadBot" } });
      const html = res.ok ? (await res.text()).slice(0, 2_000_000) : "";
      ok = res.ok && listingConfirmsLink(res.url || listingUrl, dir.url, html, w.website);
    } catch {
      ok = false;
    }
    await context.supabase.from("backlink_submissions" as never).update(
      { live_ok: ok, live_checked_at: new Date().toISOString(), status: ok ? "live" : "submitted" } as never,
    ).eq("workspace_id", data.workspaceId).eq("directory_id", dir.id);
    return { ok };
  });
