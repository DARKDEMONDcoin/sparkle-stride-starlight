const names = { sonny: "siraj", eva: "amal", sam: "salem", nour: "nour", dana: "dana", adam: "adam", abdullah: "abdullah" } as const;
export type EmployeeSlug = typeof names[keyof typeof names];
export function employeeCalendarSlug(id: string): EmployeeSlug {
  if (id in names) return names[id as keyof typeof names];
  if (Object.values(names).some((name) => name === id)) return id as EmployeeSlug;
  return "siraj";
}
export const employeeSlug = (id: string) => id in names ? names[id as keyof typeof names] : id;
export const employeeId = (slug: string) => Object.entries(names).find(([, name]) => name === slug)?.[0] ?? slug;