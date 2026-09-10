import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMpPayment } from "@/lib/mercadopago";
import { decryptSecret } from "@/lib/crypto";

async function settleById(mpId: string) {
  const rows = await prisma.payment.findMany({
    where: { method: "MERCADOPAGO", status: "PENDING" },
    include: { barber: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  for (const row of rows) {
    let access = "";
    try {
      access = decryptSecret(row.barber.mpAccessEnc);
    } catch {
      continue;
    }
    if (!access) continue;
    try {
      const remote = await getMpPayment(access, mpId);
      const ext = String(remote.external_reference || "");
      if (ext && ext !== row.id) continue;
      const status = remote.status;
      const mapped =
        status === "approved" ? "PAID" : status === "rejected" ? "FAILED" : status === "cancelled" ? "CANCELLED" : "PENDING";
      await prisma.payment.update({
        where: { id: row.id },
        data: {
          mpPaymentId: String(remote.id || mpId),
          status: mapped,
          paidAt: mapped === "PAID" ? new Date() : row.paidAt,
        },
      });
      if (mapped === "PAID" && row.appointmentId) {
        await prisma.appointment.update({
          where: { id: row.appointmentId },
          data: { status: "CONFIRMED" },
        });
      }
      return;
    } catch {
      continue;
    }
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  let mpId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";
  const body = await req.json().catch(() => null);
  if (!mpId) mpId = String(body?.data?.id || body?.id || "");
  if (mpId) await settleById(mpId);
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  return POST(req);
}
