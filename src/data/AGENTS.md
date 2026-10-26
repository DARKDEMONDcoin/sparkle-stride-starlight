# Data rules

- All plan prices live in src/data/pricing.config.ts (null = shown as «قريبًا»); components never hard-code amounts. Why: swap/add currencies in one place.
