import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { planPatchSchema } from "@/lib/validators";
import { DEFAULT_FEATURES, parseFeatures } from "@/lib/features";
import { slugify } from "@/lib/utils";
import { syncPendingSubscription } from "@/lib/subscription";
import { notifyCatalogLive } from "@/lib/live";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth || auth.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const parsed = planPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dados inválidos.");
  const current = await prisma.plan.findUnique({ where: { id } });
  if (!current) return jsonError("Plano não encontrado.", 404);
  const data: Record<string, unknown> = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  );
  if (parsed.data.slug) data.slug = slugify(parsed.data.slug);
  if (parsed.data.features) {
    data.features = { ...DEFAULT_FEATURES, ...parseFeatures(current.features), ...parsed.data.features };
  }
  const plan = await prisma.plan.update({ where: { id }, data });
  if (typeof parsed.data.priceCents === "number") {
    const barbers = await prisma.barberProfile.findMany({
      where: { planId: plan.id, billingCents: null },
      select: { id: true },
    });
    for (const barber of barbers) {
      await syncPendingSubscription(barber.id, plan.priceCents);
    }
  }
  notifyCatalogLive();
  return NextResponse.json({ plan });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth || auth.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const current = await prisma.plan.findUnique({
    where: { id },
    include: { _count: { select: { barbers: true } } },
  });
  if (!current) return jsonError("Plano não encontrado.", 404);
  await prisma.plan.delete({ where: { id } });
  notifyCatalogLive();
  return NextResponse.json({ ok: true, detached: current._count.barbers });
}
