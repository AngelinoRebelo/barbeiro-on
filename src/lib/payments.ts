import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { grantPaidPeriod } from "@/lib/subscription";
import { getPlatformSettings } from "@/lib/platform";
import type { Payment } from "@prisma/client";

export function mapMpStatus(status?: string | null) {
  if (status === "approved") return "PAID" as const;
  if (status === "rejected") return "FAILED" as const;
  if (status === "cancelled") return "CANCELLED" as const;
  if (status === "refunded") return "REFUNDED" as const;
  return "PENDING" as const;
}

export function mpAccessOf(enc: string) {
  try {
    return decryptSecret(enc);
  } catch {
    return "";
  }
}

export async function credentialsForPayment(payment: Payment) {
  if (payment.kind === "SUBSCRIPTION") {
    const platform = await getPlatformSettings();
    return {
      access: mpAccessOf(platform.mpAccessEnc),
      publicKey: platform.mpPublicKey.trim(),
    };
  }
  const barber = await prisma.barberProfile.findUnique({ where: { id: payment.barberId } });
  return {
    access: barber ? mpAccessOf(barber.mpAccessEnc) : "",
    publicKey: barber?.mpPublicKey.trim() || "",
  };
}

export async function settleLocalPayment(
  localId: string,
  remote: { id?: unknown; status?: string | null; payment_method_id?: string | null },
) {
  const payment = await prisma.payment.findUnique({ where: { id: localId } });
  if (!payment) return null;
  const mapped = mapMpStatus(remote.status);
  const alreadyPaid = payment.status === "PAID";
  await prisma.payment.update({
    where: { id: localId },
    data: {
      mpPaymentId: remote.id ? String(remote.id) : payment.mpPaymentId,
      status: mapped,
      paidAt: mapped === "PAID" ? new Date() : payment.paidAt,
      method: remote.payment_method_id === "pix" ? "PIX" : payment.method,
    },
  });
  if (mapped === "PAID" && !alreadyPaid) {
    if (payment.appointmentId) {
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: { status: "CONFIRMED" },
      });
    }
    if (payment.kind === "SUBSCRIPTION") {
      await grantPaidPeriod(payment.barberId);
    }
  }
  return mapped;
}
