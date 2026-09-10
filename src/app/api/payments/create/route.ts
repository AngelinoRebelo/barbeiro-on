import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { parseFeatures } from "@/lib/features";
import { buildPixPayload } from "@/lib/pix";
import { createCheckoutPreference } from "@/lib/mercadopago";
import { decryptSecret } from "@/lib/crypto";
import { randomToken } from "@/lib/utils";

async function actor() {
  return apiUser();
}

export async function POST(req: Request) {
  const ctx = await actor();
  if (!ctx) return jsonError("Faça login para pagar.", 401);
  const body = await req.json().catch(() => ({}));
  const appointmentId = String(body.appointmentId || "");
  const method = body.method === "MERCADOPAGO" ? "MERCADOPAGO" : "PIX";

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
  if (method === "PIX" && !features.pix) return jsonError("PIX desativado para esta unidade.");
  if (method === "MERCADOPAGO" && !features.mercadopago) return jsonError("Mercado Pago desativado para esta unidade.");

  let payment = await prisma.payment.findFirst({
    where: { appointmentId, method, status: "PENDING" },
  });

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        barberId: appointment.barberId,
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        userId: appointment.userId,
        amountCents: appointment.service.priceCents,
        method,
      },
    });
  }

  if (method === "PIX") {
    if (!appointment.barber.pixKey) return jsonError("O barbeiro ainda não cadastrou a chave PIX.");
    const txid = `BO${payment.id.replace(/[^A-Za-z0-9]/g, "").slice(0, 20)}`;
    const pixPayload = buildPixPayload({
      pixKey: appointment.barber.pixKey,
      merchantName: appointment.barber.shopName,
      merchantCity: appointment.barber.city || "Sao Paulo",
      amountCents: payment.amountCents,
      txid,
      description: appointment.service.name,
    });
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: { pixPayload, pixTxid: txid },
    });
    return NextResponse.json({ paymentId: payment.id, method, redirect: `/pagar/${payment.id}` });
  }

  let access = "";
  try {
    access = decryptSecret(appointment.barber.mpAccessEnc);
  } catch {
    access = "";
  }
  if (!access) return jsonError("O barbeiro ainda não conectou o Mercado Pago.");

  const pref = await createCheckoutPreference({
    accessToken: access,
    paymentId: payment.id,
    title: `${appointment.service.name} · ${appointment.barber.shopName}`,
    amountCents: payment.amountCents,
    payerEmail: appointment.client.email || ctx.user.email,
    backPath: `/pagar/${payment.id}`,
  });

  payment = await prisma.payment.update({
    where: { id: payment.id },
    data: { mpPreferenceId: pref.id, mpInitPoint: pref.initPoint },
  });

  return NextResponse.json({
    paymentId: payment.id,
    method,
    initPoint: pref.initPoint,
    redirect: `/pagar/${payment.id}`,
  });
}

export async function PATCH(req: Request) {
  const ctx = await actor();
  if (!ctx) return jsonError("Não autenticado.", 401);
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (body.action !== "confirm") return jsonError("Ação inválida.");
  const payment = await prisma.payment.findUnique({ where: { id }, include: { barber: true } });
  if (!payment) return jsonError("Pagamento não encontrado.", 404);
  const isBarber = ctx.user.role === "BARBER" && ctx.user.barberProfile?.id === payment.barberId;
  if (!isBarber && ctx.user.role !== "ADMIN") return jsonError("Somente o barbeiro confirma PIX manualmente.", 403);
  if (payment.method !== "PIX") return jsonError("Confirmação manual apenas para PIX.");

  await prisma.payment.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (payment.appointmentId) {
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { status: "CONFIRMED" },
    });
  }
  return NextResponse.json({ ok: true, nonce: randomToken(4) });
}
