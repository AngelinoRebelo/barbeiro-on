import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { parseFeatures } from "@/lib/features";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { randomToken } from "@/lib/utils";
import { getPlatformSettings } from "@/lib/platform";
import { shopPath } from "@/lib/paths";
import { grantPaidPeriod } from "@/lib/subscription";
import { credentialsForPayment, mpAccessOf } from "@/lib/payments";

function checkoutPayload(opts: {
  paymentId: string;
  publicKey: string;
  amountCents: number;
  payerEmail: string;
  preferenceId?: string;
  slug: string;
}) {
  return {
    paymentId: opts.paymentId,
    publicKey: opts.publicKey,
    amountCents: opts.amountCents,
    payerEmail: opts.payerEmail,
    preferenceId: opts.preferenceId || "",
    embed: true,
    redirect: shopPath(opts.slug, `/pagar/${opts.paymentId}`),
  };
}

export async function POST(req: Request) {
  const ctx = await apiUser();
  if (!ctx) return jsonError("Faça login para pagar.", 401);
  const body = await req.json().catch(() => ({}));

  if (body.kind === "SUBSCRIPTION") {
    if (ctx.user.role !== "BARBER" || !ctx.user.barberProfile) return jsonError("Somente o barbeiro paga o plano.", 403);
    const profile = await prisma.barberProfile.findUnique({
      where: { id: ctx.user.barberProfile.id },
      include: { plan: true },
    });
    if (!profile?.plan) return jsonError("Nenhum plano selecionado.");
    if (profile.plan.priceCents === 0) {
      await grantPaidPeriod(profile.id);
      return NextResponse.json({ ok: true, redirect: shopPath(profile.slug, "/painel") });
    }
    const platform = await getPlatformSettings();
    const access = mpAccessOf(platform.mpAccessEnc);
    if (!access || !platform.mpPublicKey.trim()) {
      return jsonError("O admin ainda não conectou o Mercado Pago da plataforma (Public Key e Access Token).");
    }
    let payment = await prisma.payment.findFirst({
      where: { barberId: profile.id, kind: "SUBSCRIPTION", status: "PENDING" },
    });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          barberId: profile.id,
          userId: ctx.user.id,
          amountCents: profile.plan.priceCents,
          method: "MERCADOPAGO",
          kind: "SUBSCRIPTION",
        },
      });
    }
  const payPath = shopPath(profile.slug, `/pagar/${payment.id}`);
  let pref;
  try {
    pref = await createCheckoutPreference({
      accessToken: access,
      paymentId: payment.id,
      title: `Plano ${profile.plan.name} · BARBEIRO ON`,
      amountCents: payment.amountCents,
      payerEmail: ctx.user.email,
      backPath: payPath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao abrir o Mercado Pago da plataforma.";
    return jsonError(message, 502);
  }
    await prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: pref.id, mpInitPoint: pref.initPoint, method: "MERCADOPAGO" },
    });
    return NextResponse.json(
      checkoutPayload({
        paymentId: payment.id,
        publicKey: platform.mpPublicKey.trim(),
        amountCents: payment.amountCents,
        payerEmail: ctx.user.email,
        preferenceId: pref.id,
        slug: profile.slug,
      }),
    );
  }

  const appointmentId = String(body.appointmentId || "");
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { barber: true, service: true, client: true },
  });
  if (!appointment) return jsonError("Agendamento não encontrado.", 404);

  const isBarber = ctx.user.role === "BARBER" && ctx.user.barberProfile?.id === appointment.barberId;
  const isClient = ctx.user.role === "CLIENT" && (appointment.userId === ctx.user.id || appointment.client.email === ctx.user.email);
  const isAdmin = ctx.user.role === "ADMIN";
  if (!isBarber && !isClient && !isAdmin) return jsonError("Sem permissão para este pagamento.", 403);

  const features = parseFeatures(appointment.barber.features);
  if (!features.pix && !features.mercadopago) return jsonError("Pagamentos desativados para esta unidade.");

  const access = mpAccessOf(appointment.barber.mpAccessEnc);
  const publicKey = appointment.barber.mpPublicKey.trim();
  if (!access || !publicKey) {
    return jsonError("Cadastre Public Key e Access Token do Mercado Pago da unidade. PIX e cartão passam por ele, com confirmação automática.");
  }

  const paid = await prisma.payment.findFirst({
    where: { appointmentId, status: "PAID", kind: "SERVICE" },
  });
  if (paid) return jsonError("Este horário já está pago.");

  let payment = await prisma.payment.findFirst({
    where: { appointmentId, status: "PENDING", kind: "SERVICE" },
  });

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        barberId: appointment.barberId,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        userId: appointment.userId,
        amountCents: appointment.service.priceCents,
        method: "MERCADOPAGO",
        kind: "SERVICE",
      },
    });
  }

  const payPath = shopPath(appointment.barber.slug, `/pagar/${payment.id}`);
  let pref;
  try {
    pref = await createCheckoutPreference({
      accessToken: access,
      paymentId: payment.id,
      title: `${appointment.service.name} · ${appointment.barber.shopName}`,
      amountCents: payment.amountCents,
      payerEmail: appointment.client.email || ctx.user.email,
      backPath: payPath,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha ao abrir o Mercado Pago da unidade.";
    return jsonError(message, 502);
  }
  payment = await prisma.payment.update({
    where: { id: payment.id },
    data: { mpPreferenceId: pref.id, mpInitPoint: pref.initPoint, method: "MERCADOPAGO" },
  });

  return NextResponse.json(
    checkoutPayload({
      paymentId: payment.id,
      publicKey,
      amountCents: payment.amountCents,
      payerEmail: appointment.client.email || ctx.user.email,
      preferenceId: pref.id,
      slug: appointment.barber.slug,
    }),
  );
}

export async function PATCH(req: Request) {
  const ctx = await apiUser();
  if (!ctx) return jsonError("Não autenticado.", 401);
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (body.action !== "confirm") return jsonError("Ação inválida.");
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return jsonError("Pagamento não encontrado.", 404);
  if (payment.status === "PAID") return NextResponse.json({ ok: true });
  const creds = await credentialsForPayment(payment);
  if (creds.access) {
    return jsonError("Este pagamento confirma sozinho pelo Mercado Pago.");
  }
  if (ctx.user.role !== "ADMIN" && !(ctx.user.role === "BARBER" && ctx.user.barberProfile?.id === payment.barberId)) {
    return jsonError("Sem permissão.");
  }
  await prisma.payment.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (payment.kind === "SUBSCRIPTION") await grantPaidPeriod(payment.barberId);
  if (payment.appointmentId) {
    await prisma.appointment.update({ where: { id: payment.appointmentId }, data: { status: "CONFIRMED" } });
  }
  return NextResponse.json({ ok: true, nonce: randomToken(4) });
}
