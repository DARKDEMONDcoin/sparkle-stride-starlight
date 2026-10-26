/**
 * Actions that only read the owner's connected data (search/list/report).
 * They run inside the chat turn without an approval card; anything that sends,
 * publishes, edits or deletes still waits for the owner.
 */
export const READ_ONLY_ACTIONS = new Set<string>([
  "eva-gmail-search",
  "sonny-x-search",
  "sam-hubspot-search",
  "sam-airtable-list",
  "adam-read-sheet",
  "adam-gads-report",
  "adam-meta-ads-report",
  "adam-ga4-report",
  "nour-gsc-performance",
]);

export function isReadOnlyAction(id: string | null | undefined): boolean {
  return Boolean(id && READ_ONLY_ACTIONS.has(id));
}
