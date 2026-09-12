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

export const RENEW_WINDOW_DAYS = 10;

export function renewOpensAt(until: Date | null | undefined) {
  if (!until) return null;
  return addDays(until, -RENEW_WINDOW_DAYS);
}

export function canRenewPlan(until: Date | null | undefined, now = new Date()) {
  if (!hasAccess(until, now)) return true;
  return daysLeft(until, now) <= RENEW_WINDOW_DAYS;
}

export function defaultDuration(interval: string) {
  return interval === "YEARLY" ? 365 : 30;
}
