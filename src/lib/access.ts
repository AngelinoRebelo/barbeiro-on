export function addDays(from: Date, days: number) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function extendAccess(current: Date | null | undefined, days: number, now = new Date()) {
  const base = current && current.getTime() > now.getTime() ? current : now;
  return addDays(base, Math.max(0, days));
}

export function daysLeft(until: Date | null | undefined, now = new Date()) {
  if (!until) return 0;
  return Math.max(0, Math.ceil((until.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
}

export function hasAccess(until: Date | null | undefined, now = new Date()) {
  return Boolean(until && until.getTime() > now.getTime());
}

export function defaultDuration(interval: string) {
  return interval === "YEARLY" ? 365 : 30;
}
