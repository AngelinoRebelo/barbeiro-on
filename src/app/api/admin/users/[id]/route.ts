import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { DEFAULT_FEATURES, parseFeatures, type FeatureFlags } from "@/lib/features";
import { sendApprovedEmail, sendVerifyEmail } from "@/lib/brevo";
import { randomToken } from "@/lib/utils";
import { logAction } from "@/lib/barber";
import { addAccessDays, assignPlan, subscriptionAmountCents, syncPendingSubscription } from "@/lib/subscription";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth || auth.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { barberProfile: { include: { _count: { select: { clients: true, appointments: true, services: true } } } } },
  });
  if (!user) return jsonError("Usuário não encontrado.", 404);
  return NextResponse.json({
    user: {
      ...user,
      passwordHash: undefined,
      barberProfile: user.barberProfile
        ? { ...user.barberProfile, mpAccessEnc: user.barberProfile.mpAccessEnc ? "set" : "", features: parseFeatures(user.barberProfile.features) }
        : null,
    },
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth || auth.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const user = await prisma.user.findUnique({ where: { id }, include: { barberProfile: true } });
  if (!user) return jsonError("Usuário não encontrado.", 404);
  if (user.role === "ADMIN" && user.id !== auth.user.id && body.status === "SUSPENDED") {
    return jsonError("Não é possível suspender outro admin nesta versão.", 400);
  }

  if (body.action === "verify") {
    await prisma.user.update({
      where: { id },
      data: { status: "ACTIVE", emailVerified: new Date() },
    });
    await logAction(auth.user.id, "admin.verify", id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "resend") {
    const token = randomToken();
    await prisma.authToken.deleteMany({ where: { userId: id, type: "EMAIL_VERIFY" } });
    await prisma.authToken.create({
      data: { userId: id, type: "EMAIL_VERIFY", token, expiresAt: new Date(Date.now() + 86400000) },
    });
    await sendVerifyEmail(user.email, user.name, token);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "assignPlan") {
    if (!user.barberProfile) return jsonError("Somente unidades recebem plano.", 400);
    if (typeof body.planId !== "string" || !body.planId) return jsonError("Escolha um plano.");
    const updated = await assignPlan(user.barberProfile.id, body.planId);
    if (!updated) return jsonError("Plano não encontrado.", 404);
    await logAction(auth.user.id, "admin.assignPlan", id, { planId: body.planId });
    return NextResponse.json({ ok: true, accessUntil: updated.accessUntil });
  }

  if (body.action === "addDays") {
    if (!user.barberProfile) return jsonError("Somente unidades recebem dias de acesso.", 400);
    const days = Math.floor(Number(body.days));
    if (!Number.isFinite(days) || days < 1 || days > 3650) return jsonError("Informe entre 1 e 3650 dias.");
    const updated = await addAccessDays(user.barberProfile.id, days);
    if (!updated) return jsonError("Unidade não encontrada.", 404);
    await logAction(auth.user.id, "admin.addDays", id, { days });
    return NextResponse.json({ ok: true, accessUntil: updated.accessUntil });
  }

  if (body.action === "setBilling") {
    if (!user.barberProfile) return jsonError("Somente unidades recebem valor de cobrança.", 400);
    let billingCents: number | null = null;
    if (body.billingCents !== null && body.billingCents !== undefined && body.billingCents !== "") {
      const value = Math.floor(Number(body.billingCents));
      if (!Number.isFinite(value) || value < 0 || value > 10_000_000) {
        return jsonError("Informe um valor entre R$ 0 e R$ 100.000,00.");
      }
      billingCents = value;
    }
    const updated = await prisma.barberProfile.update({
      where: { id: user.barberProfile.id },
      data: { billingCents },
      include: { plan: true },
    });
    await syncPendingSubscription(updated.id, subscriptionAmountCents(updated));
    await logAction(auth.user.id, "admin.setBilling", id, { billingCents });
    return NextResponse.json({
      ok: true,
      billingCents: updated.billingCents,
      chargeCents: subscriptionAmountCents(updated),
    });
  }

  const data: { status?: "ACTIVE" | "SUSPENDED" | "PENDING_EMAIL" } = {};
  if (body.status === "ACTIVE" || body.status === "SUSPENDED") data.status = body.status;
  if (Object.keys(data).length) {
    await prisma.user.update({ where: { id }, data });
  }

  if (user.barberProfile) {
    const patch: {
      approved?: boolean;
      features?: FeatureFlags;
    } = {};
    if (typeof body.approved === "boolean") patch.approved = body.approved;
    if (body.features && typeof body.features === "object") {
      patch.features = { ...DEFAULT_FEATURES, ...parseFeatures(user.barberProfile.features), ...body.features };
    }
    if (Object.keys(patch).length) {
      await prisma.barberProfile.update({ where: { id: user.barberProfile.id }, data: patch });
      if (patch.approved === true && !user.barberProfile.approved) {
        await sendApprovedEmail(user.email, user.name, user.barberProfile.shopName).catch(() => null);
      }
    }
  }

  await logAction(auth.user.id, "admin.patch", id, body);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth || auth.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  if (id === auth.user.id) return jsonError("Você não pode excluir a própria conta.", 400);
  const user = await prisma.user.findUnique({ where: { id }, include: { barberProfile: true } });
  if (!user) return jsonError("Usuário não encontrado.", 404);
  if (user.role === "ADMIN") return jsonError("Não é possível excluir outro admin.", 400);

  if (user.barberProfile) {
    const barberId = user.barberProfile.id;
    await prisma.$transaction(async (tx) => {
      await tx.appointment.deleteMany({ where: { barberId } });
      await tx.payment.deleteMany({ where: { barberId } });
      await tx.barberClient.deleteMany({ where: { barberId } });
      await tx.service.deleteMany({ where: { barberId } });
      await tx.user.updateMany({ where: { shopId: barberId }, data: { shopId: null } });
      await tx.user.delete({ where: { id } });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.barberClient.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });
  }

  await logAction(auth.user.id, "admin.deleteUser", id, { email: user.email, role: user.role });
  return NextResponse.json({ ok: true });
}
