import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMpPayment } from "@/lib/mercadopago";
import { decryptSecret } from "@/lib/crypto";
import { getPlatformSettings } from "@/lib/platform";
import { settleLocalPayment } from "@/lib/payments";

async function trySettle(access: string, mpId: string, rowId?: string) {
  const remote = await getMpPayment(access, mpId);
  const ext = String(remote.external_reference || "");
  if (rowId && ext && ext !== rowId) return false;
  const payment = ext
    ? await prisma.payment.findUnique({ where: { id: ext } })
    : rowId
      ? await prisma.payment.findUnique({ where: { id: rowId } })
      : await prisma.payment.findFirst({ where: { mpPaymentId: String(mpId) } });
  if (!payment) return false;
  await settleLocalPayment(payment.id, remote);
  return true;
}

async function settleById(mpId: string) {
  const platform = await getPlatformSettings();
  try {
    const access = decryptSecret(platform.mpAccessEnc);
    if (access && (await trySettle(access, mpId))) return;
  } catch {
    /* platform token ausente */
  }

  const rows = await prisma.payment.findMany({
    where: { status: "PENDING" },
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
      if (await trySettle(access, mpId, row.id)) return;
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
