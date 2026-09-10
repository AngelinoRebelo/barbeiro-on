import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);

  const [users, barbers, pending, appointments, paid] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "BARBER" } }),
    prisma.barberProfile.count({ where: { approved: false } }),
    prisma.appointment.count(),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true }, _count: true }),
  ]);

  return NextResponse.json({
    users,
    barbers,
    pending,
    appointments,
    paidCount: paid._count,
    gmvCents: paid._sum.amountCents || 0,
  });
}
