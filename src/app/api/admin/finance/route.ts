import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { monthRangeSP, yearMonthSP } from "@/lib/utils";

export async function GET(req: Request) {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);

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
      OR: [{ createdAt: { gte: start, lt: end } }, { paidAt: { gte: start, lt: end } }],
    },
    include: {
      barber: {
        select: {
          id: true,
          shopName: true,
          slug: true,
          accessUntil: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      user: { select: { id: true, name: true, email: true, role: true } },
      client: { select: { name: true, email: true, phone: true } },
      appointment: { select: { startsAt: true, status: true, service: { select: { name: true } } } },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 2000,
  });

  const items = payments.map((p) => {
    const payer =
      p.kind === "SUBSCRIPTION"
        ? p.barber.user
        : p.user || { id: p.clientId || p.barber.user.id, name: p.client?.name || p.barber.user.name, email: p.client?.email || p.barber.user.email, role: "CLIENT" as const };
    return {
      id: p.id,
      amountCents: p.amountCents,
      method: p.method,
      kind: p.kind,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
      mpPaymentId: p.mpPaymentId,
      shopName: p.barber.shopName,
      slug: p.barber.slug,
      barberId: p.barber.id,
      accessUntil: p.barber.accessUntil?.toISOString() ?? null,
      ownerName: p.barber.user.name,
      ownerEmail: p.barber.user.email,
      ownerId: p.barber.user.id,
      payerId: payer.id,
      payerName: payer.name,
      payerEmail: payer.email,
      payerRole: "role" in payer ? payer.role : p.kind === "SUBSCRIPTION" ? "BARBER" : "CLIENT",
      clientName: p.client?.name || "",
      clientPhone: p.client?.phone || "",
      clientEmail: p.client?.email || "",
      serviceName: p.kind === "SUBSCRIPTION" ? "Mensalidade da plataforma" : p.appointment?.service?.name || "Serviço",
      appointmentAt: p.appointment?.startsAt?.toISOString() ?? null,
      appointmentStatus: p.appointment?.status ?? null,
    };
  });

  const from = start.toISOString();
  const to = end.toISOString();
  const inMonth = (iso: string | null) => !!iso && iso >= from && iso < to;
  const paidInMonth = items.filter((p) => p.status === "PAID" && inMonth(p.paidAt));
  const createdHere = (status: string) => items.filter((p) => p.status === status && inMonth(p.createdAt));
  const pending = createdHere("PENDING");
  const failed = createdHere("FAILED");
  const cancelled = createdHere("CANCELLED");
  const refunded = items.filter((p) => p.status === "REFUNDED");
  const planPaid = paidInMonth.filter((p) => p.kind === "SUBSCRIPTION");
  const servicePaid = paidInMonth.filter((p) => p.kind === "SERVICE");
  const sum = (rows: typeof items) => rows.reduce((s, p) => s + p.amountCents, 0);

  const byOwner = new Map<string, typeof items>();
  for (const item of items) {
    const list = byOwner.get(item.ownerId) || [];
    list.push(item);
    byOwner.set(item.ownerId, list);
  }

  const users = [...byOwner.entries()]
    .map(([ownerId, rows]) => {
      const first = rows[0];
      const paid = rows.filter((p) => p.status === "PAID" && inMonth(p.paidAt));
      const open = rows.filter((p) => p.status === "PENDING" && inMonth(p.createdAt));
      const lastPaid = rows
        .filter((p) => p.status === "PAID")
        .sort((a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime())[0];
      return {
        ownerId,
        name: first.ownerName,
        email: first.ownerEmail,
        shopName: first.shopName,
        slug: first.slug,
        accessUntil: first.accessUntil,
        paidCents: sum(paid),
        paidCount: paid.length,
        pendingCents: sum(open),
        pendingCount: open.length,
        lastPaidAt: lastPaid?.paidAt || lastPaid?.createdAt || null,
        lastPaidCents: lastPaid?.amountCents ?? null,
        lastPaidKind: lastPaid?.kind ?? null,
        payments: rows.sort(
          (a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime(),
        ),
      };
    })
    .sort((a, b) => b.paidCents - a.paidCents || a.name.localeCompare(b.name, "pt-BR"));

  return NextResponse.json({
    year,
    month,
    summary: {
      receivedCents: sum(paidInMonth),
      receivedCount: paidInMonth.length,
      planCents: sum(planPaid),
      planCount: planPaid.length,
      serviceCents: sum(servicePaid),
      serviceCount: servicePaid.length,
      pendingCents: sum(pending),
      pendingCount: pending.length,
      failedCents: sum(failed),
      failedCount: failed.length,
      cancelledCents: sum(cancelled),
      cancelledCount: cancelled.length,
      refundedCents: sum(refunded),
      refundedCount: refunded.length,
      operations: items.length,
      users: users.length,
    },
    users,
  });
}
