const names: Record<string, string> = { sonny: "siraj", eva: "amal", sam: "salem" };
export const employeeSlug = (id: string) => names[id] ?? id;
export const employeeId = (slug: string) => Object.entries(names).find(([, name]) => name === slug)?.[0] ?? slug;