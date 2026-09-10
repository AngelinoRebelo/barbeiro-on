import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { isReservedSlug } from "@/lib/paths";

export async function uniqueSlug(name: string) {
  let base = slugify(name);
  if (isReservedSlug(base)) base = `loja-${base}`;
  let slug = base;
  let i = 1;
  while (isReservedSlug(slug) || (await prisma.barberProfile.findUnique({ where: { slug } }))) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function logAction(actorId: string | null, action: string, target = "", meta?: unknown) {
  await prisma.auditLog.create({
    data: { actorId, action, target, meta: meta as object | undefined },
  });
}

export const DEFAULT_SERVICES = [
  { name: "Corte masculino", category: "HAIR" as const, durationMin: 30, priceCents: 4500, description: "Corte clássico ou degradê." },
  { name: "Barba", category: "BEARD" as const, durationMin: 20, priceCents: 3500, description: "Acabamento e hidratação." },
  { name: "Corte + barba", category: "COMBO" as const, durationMin: 50, priceCents: 7000, description: "Experiência completa." },
];
