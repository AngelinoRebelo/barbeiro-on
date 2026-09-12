import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { paidFrom, queueForAppointment } from "@/lib/queue";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "CLIENT") return jsonError("Acesso negado.", 403);
  const appointments = await prisma.appointment.findMany({
    where: { userId: ctx.user.id },
    include: {
      service: true,
      payments: { select: { id: true, status: true } },
      barber: { select: { id: true, shopName: true, slug: true, city: true } },
    },
    orderBy: { startsAt: "desc" },
    take: 50,
  });
  const items = await Promise.all(
    appointments.map(async (a) => ({
      ...a,
      paid: paidFrom(a.payments),
      queue: await queueForAppointment(a.barber.id, a),
    })),
  );
  return NextResponse.json({ appointments: items });
}
