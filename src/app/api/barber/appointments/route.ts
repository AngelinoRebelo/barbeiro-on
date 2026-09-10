import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { appointmentSchema } from "@/lib/validators";
import { parseFeatures } from "@/lib/features";
import { combineDateTimeSP } from "@/lib/utils";
import { hasAccess } from "@/lib/access";

async function barber() {
  const ctx = await apiUser();
  if (!ctx?.user.barberProfile?.approved) return null;
  if (!hasAccess(ctx.user.barberProfile.accessUntil)) return null;
  return { ...ctx, profile: ctx.user.barberProfile, features: parseFeatures(ctx.user.barberProfile.features) };
}

export async function GET(req: Request) {
  const ctx = await barber();
  if (!ctx) return jsonError("Acesso negado.", 403);
  if (!ctx.features.agenda) return jsonError("Agenda desativada.", 403);
  const date = new URL(req.url).searchParams.get("date");
  const where = date
    ? {
        barberId: ctx.profile.id,
        startsAt: {
          gte: new Date(`${date}T00:00:00-03:00`),
          lt: new Date(`${date}T23:59:59-03:00`),
        },
      }
    : { barberId: ctx.profile.id };
  const appointments = await prisma.appointment.findMany({
    where,
    include: { client: true, service: true },
    orderBy: { startsAt: "asc" },
    take: 200,
  });
  return NextResponse.json({ appointments });
}

export async function POST(req: Request) {
  const ctx = await barber();
  if (!ctx) return jsonError("Acesso negado.", 403);
  if (!ctx.features.agenda) return jsonError("Agenda desativada.", 403);
  const parsed = appointmentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Dados inválidos.");

  const [client, service] = await Promise.all([
    prisma.barberClient.findFirst({ where: { id: parsed.data.clientId, barberId: ctx.profile.id } }),
    prisma.service.findFirst({ where: { id: parsed.data.serviceId, barberId: ctx.profile.id, active: true } }),
  ]);
  if (!client || !service) return jsonError("Cliente ou serviço inválido.");

  const startsAt = combineDateTimeSP(parsed.data.date, parsed.data.time);
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  const overlap = await prisma.appointment.findFirst({
    where: {
      barberId: ctx.profile.id,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (overlap) return jsonError("Horário já ocupado.");

  const appointment = await prisma.appointment.create({
    data: {
      barberId: ctx.profile.id,
      clientId: client.id,
      userId: client.userId,
      serviceId: service.id,
      startsAt,
      endsAt,
      notes: parsed.data.notes || "",
    },
    include: { client: true, service: true },
  });
  return NextResponse.json({ appointment });
}
