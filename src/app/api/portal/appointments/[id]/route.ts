import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { paidFrom } from "@/lib/queue-view";
import { notifyShopLive } from "@/lib/live";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth || auth.user.role !== "CLIENT") return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const appointment = await prisma.appointment.findFirst({
    where: { id, userId: auth.user.id },
    include: { payments: { select: { status: true } }, barber: { select: { slug: true } } },
  });
  if (!appointment) return jsonError("Agendamento não encontrado.", 404);
  if (appointment.status === "DONE") return jsonError("Horário já concluído.");
  if (paidFrom(appointment.payments) === "PAID") {
    return jsonError("Não é possível excluir um horário já pago.");
  }
  await prisma.payment.updateMany({
    where: { appointmentId: id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  notifyShopLive(appointment.barber.slug);
  return NextResponse.json({ ok: true });
}
