import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { credentialsForPayment, settleLocalPayment } from "@/lib/payments";
import { getMpPayment } from "@/lib/mercadopago";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { barber: { select: { slug: true, shopName: true, mpPublicKey: true } } },
  });
  if (!payment) return jsonError("Pagamento não encontrado.", 404);

  const creds = await credentialsForPayment(payment);
  if (payment.status !== "PAID" && payment.mpPaymentId && creds.access) {
    try {
      const remote = await getMpPayment(creds.access, payment.mpPaymentId);
      await settleLocalPayment(payment.id, remote);
    } catch {
      /* webhook still settles */
    }
  }

  const fresh = await prisma.payment.findUnique({ where: { id: payment.id } });
  if (!fresh) return jsonError("Pagamento não encontrado.", 404);

  return NextResponse.json({
    paymentId: fresh.id,
    status: fresh.status,
    amountCents: fresh.amountCents,
    publicKey: creds.publicKey,
    preferenceId: fresh.mpPreferenceId || "",
    mpPaymentId: fresh.mpPaymentId || "",
    method: fresh.method,
    kind: fresh.kind,
    slug: payment.barber.slug,
    shopName: payment.barber.shopName,
  });
}
