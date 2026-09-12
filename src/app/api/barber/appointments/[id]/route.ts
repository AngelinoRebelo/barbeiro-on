import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import type { AppointmentStatus } from "@prisma/client";
import { hasAccess } from "@/lib/access";
import { verifyPassword } from "@/lib/password";
import { paidFrom } from "@/lib/queue-view";

type Ctx = { params: Promise<{ id: string }> };

async function owned(id: string) {
  const auth = await apiUser();
  if (!auth?.user.barberProfile) return null;
  if (!hasAccess(auth.user.barberProfile.accessUntil)) return { error: jsonError("Assinatura vencida. Renove o plano.", 402) };
  const appointment = await prisma.appointment.findFirst({
    where: { id, barberId: auth.user.barberProfile.id },
    include: { payments: { select: { status: true } } },
  });
  if (!appointment) return { error: jsonError("Agendamento não encontrado.", 404) };
  return { auth, appointment };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const boxed = await owned(id);
  if (!boxed) return jsonError("Acesso negado.", 403);
  if ("error" in boxed && boxed.error) return boxed.error;
  if (!("appointment" in boxed)) return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));
  const allowed: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "DONE", "CANCELLED", "NO_SHOW"];
  if (!allowed.includes(body.status)) return jsonError("Status inválido.");
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: body.status },
    include: { client: true, service: true },
  });
  return NextResponse.json({ appointment });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const boxed = await owned(id);
  if (!boxed) return jsonError("Acesso negado.", 403);
  if ("error" in boxed && boxed.error) return boxed.error;
  if (!("appointment" in boxed)) return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  if (!password) return jsonError("Informe sua senha para excluir.");
  const ok = await verifyPassword(password, boxed.auth.user.passwordHash);
  if (!ok) return jsonError("Senha incorreta.");
  if (paidFrom(boxed.appointment.payments) === "PAID") {
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
  return NextResponse.json({ ok: true });
}
