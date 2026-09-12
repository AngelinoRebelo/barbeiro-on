export function brandUrl(slug: string, brandAt?: Date | string | null) {
  if (!brandAt) return "";
  const stamp = brandAt instanceof Date ? brandAt.getTime() : new Date(brandAt).getTime();
  if (!Number.isFinite(stamp) || stamp <= 0) return "";
  return `/api/shop/${encodeURIComponent(slug)}/brand?v=${stamp}`;
}
