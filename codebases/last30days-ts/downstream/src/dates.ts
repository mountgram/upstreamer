export function startOfLookback(now: Date, lookbackDays = 30): Date {
  if (!Number.isFinite(lookbackDays) || lookbackDays < 1) {
    throw new Error("lookbackDays must be a positive number");
  }
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - lookbackDays);
  return since;
}

export function parseDate(value?: string | number | Date): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function isWithinLookback(value: string | undefined, since: Date): boolean {
  const date = parseDate(value);
  return !date || date >= since;
}
