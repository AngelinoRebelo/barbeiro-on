export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return base || "barbearia";
}

export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function toCents(value: string) {
  const normalized = String(value).trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 100);
}

export function appUrl() {
  const env = (process.env.APP_URL || "").replace(/\/$/, "");
  if (env && !isLocalHost(env)) return env;
  const railway = (process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (railway && !isLocalHost(railway)) return `https://${railway}`;
  return env || "http://localhost:3000";
}

function isLocalHost(value: string) {
  const host = value.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
}

export function publicOrigin(req: { url: string; headers: Headers }) {
  const forwardedHost = (req.headers.get("x-forwarded-host") || "").split(",")[0].trim();
  const forwardedProto = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (forwardedHost && !isLocalHost(forwardedHost)) {
    return `${forwardedProto || "https"}://${forwardedHost}`;
  }
  const origin = (req.headers.get("origin") || "").replace(/\/$/, "");
  if (origin && !isLocalHost(origin)) return origin;
  const host = (req.headers.get("host") || "").split(",")[0].trim();
  if (host && !isLocalHost(host)) {
    const proto = forwardedProto || (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  try {
    const url = new URL(req.url);
    if (!isLocalHost(url.hostname)) return url.origin;
  } catch {
    /* ignore */
  }
  return appUrl();
}

export function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
  }).format(date);
}

export function ymd(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function hm(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function parseHm(value: string) {
  const [h, m] = value.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

export function startOfDaySP(isoDate: string) {
  return new Date(`${isoDate}T00:00:00-03:00`);
}

export function combineDateTimeSP(isoDate: string, time: string) {
  return new Date(`${isoDate}T${time}:00-03:00`);
}

export function monthRangeSP(year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  const start = new Date(`${year}-${mm}-01T00:00:00-03:00`);
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const end = new Date(`${next.y}-${String(next.m).padStart(2, "0")}-01T00:00:00-03:00`);
  return { start, end };
}

export function yearMonthSP(date = new Date()) {
  const [year, month] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number);
  return { year, month };
}

export const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  MERCADOPAGO: "Mercado Pago (cartão)",
};

export const CATEGORY_LABEL: Record<string, string> = {
  HAIR: "Cabelo",
  BEARD: "Barba",
  COMBO: "Combo",
  OTHER: "Outro",
};

export const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  DONE: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Estornado",
  PENDING_EMAIL: "Aguardando e-mail",
  ACTIVE: "Ativo",
  SUSPENDED: "Suspenso",
  ADMIN: "Admin",
  BARBER: "Barbeiro",
  CLIENT: "Cliente",
};

export function statusLabel(value: string) {
  return STATUS_LABEL[value] || value;
}
