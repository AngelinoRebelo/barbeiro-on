import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { credentialsForPayment, settleLocalPayment } from "@/lib/payments";
import { createMpApiPayment } from "@/lib/mercadopago";
import { appUrl, randomToken } from "@/lib/utils";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { client: true, user: true },
  });
  if (!payment) return jsonError("Pagamento não encontrado.", 404);
  if (payment.status === "PAID") {
    return NextResponse.json({ status: "approved", id: payment.mpPaymentId });
  }

  const creds = await credentialsForPayment(payment);
  if (!creds.access || !creds.publicKey) {
    return jsonError("Mercado Pago não configurado para este pagamento.");
  }

  const incoming = await req.json().catch(() => ({}));
  const formData = (incoming.formData && typeof incoming.formData === "object" ? incoming.formData : incoming) as Record<string, unknown>;
  const payer = (formData.payer && typeof formData.payer === "object" ? formData.payer : {}) as Record<string, unknown>;
  const email = String(payer.email || payment.client?.email || payment.user?.email || "");

  const body: Record<string, unknown> = {
    ...formData,
    transaction_amount: Number((payment.amountCents / 100).toFixed(2)),
    description: payment.kind === "SUBSCRIPTION" ? "Plano BARBEIRO ON" : "Serviço da barbearia",
    external_reference: payment.id,
    notification_url: `${appUrl()}/api/payments/webhook/mercadopago`,
    payer: {
      ...payer,
      email,
    },
  };

  if (!email) {
    return jsonError("Informe o e-mail no checkout do Mercado Pago.");
  }

  let remote;
  try {
    remote = await createMpApiPayment(creds.access, body, `${payment.id}-${randomToken(8)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no Mercado Pago.";
    return jsonError(message, 502);
  }

  await settleLocalPayment(payment.id, remote);
  return NextResponse.json(remote);
}
