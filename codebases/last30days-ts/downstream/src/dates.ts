export function getDateRange(days = 30): { from: string; to: string } {
  const now = new Date();
  const to = formatDate(now);
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: formatDate(from), to };
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // ISO 8601
  const iso = new Date(dateStr);
  if (!isNaN(iso.getTime())) return iso;
  // Unix timestamp (seconds)
  const ts = Number(dateStr);
  if (!isNaN(ts) && ts > 0) return new Date(ts * 1000);
  // YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return null;
}

export function daysAgo(dateStr: string): number | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function recencyScore(dateStr: string, maxDays = 30): number {
  const days = daysAgo(dateStr);
  if (days === null) return 50;
  if (days <= 0) return 100;
  if (days >= maxDays) return 0;
  return Math.round(((maxDays - days) / maxDays) * 100);
}

export function getDateConfidence(
  dateStr: string,
  fromDate: string,
  toDate: string
): "high" | "med" | "low" {
  const d = parseDate(dateStr);
  if (!d) return "low";
  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  if (!from || !to) return "med";
  const margin = (to.getTime() - from.getTime()) / 7;
  if (d >= from && d <= to) return "high";
  if (d < new Date(from.getTime() - margin)) return "low";
  return "med";
}

export function timestampToDate(ts: number): string {
  return formatDate(new Date(ts * 1000));
}
