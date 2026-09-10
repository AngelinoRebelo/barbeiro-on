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

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
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
