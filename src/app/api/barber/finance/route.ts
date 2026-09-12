import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiBarber, jsonError } from "@/lib/auth";
import { monthRangeSP, yearMonthSP } from "@/lib/utils";

export async function GET(req: Request) {
  const boxed = await apiBarber();
  if (!boxed) return jsonError("Acesso negado.", 403);
  if ("error" in boxed && boxed.error) return boxed.error;
  if (!("profile" in boxed)) return jsonError("Acesso negado.", 403);
  if (!boxed.features.pix && !boxed.features.mercadopago) {
    return jsonError("Financeiro desativado.", 403);
  }

  const now = yearMonthSP();
  const url = new URL(req.url);
  const year = Number(url.searchParams.get("year")) || now.year;
  const month = Number(url.searchParams.get("month")) || now.month;
  if (year < 2020 || year > now.year + 1 || month < 1 || month > 12) {
    return jsonError("Mês ou ano inválido.");
  }

  const { start, end } = monthRangeSP(year, month);
  const payments = await prisma.payment.findMany({
    where: {
      barberId: boxed.profile.id,
      kind: "SERVICE",
      OR: [{ createdAt: { gte: start, lt: end } }, { paidAt: { gte: start, lt: end } }],
    },
    include: {
      client: { select: { name: true, email: true, phone: true } },
      appointment: { include: { service: { select: { name: true } } } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 800,
  });

  const items = payments.map((p) => ({
    id: p.id,
    amountCents: p.amountCents,
    method: p.method,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
    mpPaymentId: p.mpPaymentId,
    clientName: p.client?.name || "Cliente",
    clientPhone: p.client?.phone || "",
    clientEmail: p.client?.email || "",
    serviceName: p.appointment?.service?.name || "Serviço avulso",
    appointmentAt: p.appointment?.startsAt?.toISOString() ?? null,
    appointmentStatus: p.appointment?.status ?? null,
  }));

  const from = start.toISOString();
  const to = end.toISOString();
  const inMonth = (iso: string | null) => !!iso && iso >= from && iso < to;
  const paidInMonth = items.filter((p) => p.status === "PAID" && inMonth(p.paidAt));
  const createdHere = (status: string) => items.filter((p) => p.status === status && inMonth(p.createdAt));

  const pending = createdHere("PENDING");
  const failed = createdHere("FAILED");
  const cancelled = createdHere("CANCELLED");
  const refunded = items.filter((p) => p.status === "REFUNDED");
  const groupedIds = new Set([...paidInMonth, ...pending, ...failed, ...cancelled, ...refunded].map((p) => p.id));
  const other = items.filter((p) => !groupedIds.has(p.id));

  const sum = (rows: typeof items) => rows.reduce((s, p) => s + p.amountCents, 0);
  const byTime = (a: (typeof items)[number], b: (typeof items)[number]) =>
    new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime();

  return NextResponse.json({
    shopName: boxed.profile.shopName,
    slug: boxed.profile.slug,
    year,
    month,
    summary: {
      receivedCents: sum(paidInMonth),
      pendingCents: sum(pending),
      failedCents: sum(failed),
      cancelledCents: sum(cancelled),
      refundedCents: sum(refunded),
      receivedCount: paidInMonth.length,
      pendingCount: pending.length,
      failedCount: failed.length,
      cancelledCount: cancelled.length,
      refundedCount: refunded.length,
      operations: items.length,
    },
    groups: [
      { key: "paid", title: "Recebidos", hint: "Pagamentos confirmados neste mês", items: paidInMonth.sort(byTime) },
      { key: "pending", title: "Aguardando pagamento", hint: "Cobranças abertas neste mês", items: pending.sort(byTime) },
      { key: "failed", title: "Não concluídos", hint: "Tentativas que falharam", items: failed.sort(byTime) },
      { key: "cancelled", title: "Cancelados", hint: "Cobranças canceladas neste mês", items: cancelled.sort(byTime) },
      { key: "refunded", title: "Estornos", hint: "Valores devolvidos", items: refunded.sort(byTime) },
      { key: "other", title: "Outras movimentações", hint: "Geradas neste mês e liquidadas em outro período", items: other.sort(byTime) },
    ].filter((g) => g.key !== "other" || g.items.length > 0),
  });
}
