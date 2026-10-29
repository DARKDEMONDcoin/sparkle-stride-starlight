/** Browser-safe catalog of the 50 backlink/citation directories Nour prepares submissions for. */
export type BacklinkDirectory = { id: string; name: string; url: string; category: "startup" | "ai" | "saas" | "general" | "dev" };

const raw: [string, BacklinkDirectory["category"]][] = [
  ["crunchbase.com", "startup"], ["download.cnet.com", "general"], ["whatlaunched.today", "startup"],
  ["g2.com", "saas"], ["yourstory.com", "startup"], ["hashnode.com", "dev"], ["stackshare.io", "dev"],
  ["brownbook.net", "general"], ["twelve.tools", "ai"], ["fazier.com", "startup"], ["startupbase.io", "startup"],
  ["activesearchresults.com", "general"], ["toolpilot.ai", "ai"], ["startupfa.me", "startup"],
  ["theresanaiforthat.com", "ai"], ["comparecamp.com", "saas"], ["saashub.com", "saas"], ["viesearch.com", "general"],
  ["uneed.best", "startup"], ["linkcentre.com", "general"], ["toolify.ai", "ai"], ["magicbox.tools", "ai"],
  ["code.market", "dev"], ["sidebar.io", "dev"], ["startupslab.site", "startup"], ["hotvsnot.com", "general"],
  ["sideprojectors.com", "startup"], ["toolfolio.com", "saas"], ["futuretools.io", "ai"], ["marketingdb.live", "saas"],
  ["goodaitools.com", "ai"], ["startupstash.com", "startup"], ["betterlaunch.co", "startup"], ["microlaunch.net", "startup"],
  ["aidirectori.es", "ai"], ["launchllama.co", "startup"], ["spotsaas.com", "saas"], ["outbid.lol", "startup"],
  ["trustmrr.com", "startup"], ["gravatar.com", "general"], ["alltopstartups.com", "startup"], ["smollaunch.com", "startup"],
  ["starterstory.com", "startup"], ["tinylaunch.com", "startup"], ["feedmystartup.com", "startup"], ["vercel.app", "dev"],
  ["github.com", "dev"], ["codehype.ai", "ai"], ["peerpush.com", "startup"], ["index.dodopayments.com", "saas"],
];

export const BACKLINK_DIRECTORIES: BacklinkDirectory[] = raw.map(([host, category]) => ({
  id: host.replace(/[^a-z0-9]+/g, "-"),
  name: host,
  url: `https://${host}`,
  category,
}));

export const BACKLINK_STATUSES = ["todo", "ready", "submitted", "live", "rejected"] as const;
export type BacklinkStatus = (typeof BACKLINK_STATUSES)[number];

export function directoryById(id: string) {
  return BACKLINK_DIRECTORIES.find((d) => d.id === id);
}

/** A listing only counts as live when its page is on the directory's own host and mentions the site domain. */
export function listingConfirmsLink(listingUrl: string, directoryUrl: string, html: string, siteDomain: string): boolean {
  try {
    const listingHost = new URL(listingUrl).hostname.replace(/^www\./, "");
    const dirHost = new URL(directoryUrl).hostname.replace(/^www\./, "");
    if (listingHost !== dirHost && !listingHost.endsWith(`.${dirHost}`)) return false;
  } catch {
    return false;
  }
  const domain = siteDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase();
  return domain.length > 2 && html.toLowerCase().includes(domain);
}
