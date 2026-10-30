const names = { sonny: "siraj", eva: "amal", sam: "salem", nour: "nour", dana: "dana", adam: "adam", abdullah: "abdullah" } as const;
export type EmployeeSlug = typeof names[keyof typeof names];
export function employeeCalendarSlug(id: string): Exclude<EmployeeSlug, "abdullah"> {
  if (id !== "abdullah" && id in names) return names[id as Exclude<keyof typeof names, "abdullah">];
  if (id !== "abdullah" && Object.values(names).some((name) => name === id)) return id as Exclude<EmployeeSlug, "abdullah">;
  return "siraj";
}
export const employeeSlug = (id: string) => id in names ? names[id as keyof typeof names] : id;
export const employeeId = (slug: string) => Object.entries(names).find(([, name]) => name === slug)?.[0] ?? slug;