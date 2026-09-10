import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { DEFAULT_FEATURES, parseFeatures, type FeatureFlags } from "@/lib/features";
import { sendApprovedEmail, sendVerifyEmail } from "@/lib/brevo";
import { randomToken } from "@/lib/utils";
import { logAction } from "@/lib/barber";

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
