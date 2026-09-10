import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import type { AppointmentStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const existing = await prisma.appointment.findFirst({
    where: { id, barberId: auth.user.barberProfile.id },
  });
  if (!existing) return jsonError("Agendamento não encontrado.", 404);
  const allowed: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "DONE", "CANCELLED", "NO_SHOW"];
  if (!allowed.includes(body.status)) return jsonError("Status inválido.");
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: body.status },
    include: { client: true, service: true },
  });
  return NextResponse.json({ appointment });
}
