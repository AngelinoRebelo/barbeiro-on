import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { serviceSchema } from "@/lib/validators";
import { parseFeatures } from "@/lib/features";
import { hasAccess } from "@/lib/access";

async function barber() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "BARBER" || !ctx.user.barberProfile?.approved) return null;
  if (!hasAccess(ctx.user.barberProfile.accessUntil)) return null;
  return { ...ctx, profile: ctx.user.barberProfile, features: parseFeatures(ctx.user.barberProfile.features) };
}

export async function GET() {
  const ctx = await barber();
  if (!ctx) return jsonError("Acesso negado.", 403);
  const services = await prisma.service.findMany({
    where: { barberId: ctx.profile.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ services });
}

export async function POST(req: Request) {
  const ctx = await barber();
  if (!ctx) return jsonError("Acesso negado.", 403);
  if (!ctx.features.services) return jsonError("Módulo de serviços desativado.", 403);
  const parsed = serviceSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Dados inválidos.");
  const service = await prisma.service.create({
    data: { ...parsed.data, barberId: ctx.profile.id, priceCents: parsed.data.priceCents },
  });
  return NextResponse.json({ service });
}
