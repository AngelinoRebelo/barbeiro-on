import { appUrl } from "./utils";

export const RESERVED_SLUGS = new Set([
  "admin",
  "login",
  "cadastro",
  "verificar",
  "recuperar",
  "redefinir",
  "api",
  "pagar",
  "painel",
  "portal",
  "s",
  "health",
  "planos",
  "contratante",
  "favicon.ico",
]);

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function shopPath(slug: string, suffix = "") {
  const extra = suffix.startsWith("/") ? suffix : suffix ? `/${suffix}` : "";
  return `/${slug}${extra}`;
}

export function shopUrl(slug: string, suffix = "") {
  return `${appUrl()}${shopPath(slug, suffix)}`;
}

export function homePath(role: string, slug?: string | null) {
  if (role === "ADMIN") return "/admin";
  if (role === "BARBER" && slug) return shopPath(slug, "/painel");
  if (role === "CLIENT" && slug) return shopPath(slug, "/portal");
  if (role === "BARBER") return "/login";
  return "/login";
}
