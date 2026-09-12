import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { parseFeatures } from "@/lib/features";
import { combineDateTimeSP } from "@/lib/utils";
import { queueForAppointment } from "@/lib/queue";
import { notifyShopLive } from "@/lib/live";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth || auth.user.role !== "CLIENT") return jsonError("Entre como cliente para agendar.", 401);
  const { slug } = await ctx.params;
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    include: { user: true },
  });
  if (!shop?.approved) return jsonError("Barbearia indisponível.", 404);
  const features = parseFeatures(shop.features);
  if (!features.publicShop || !features.agenda) return jsonError("Agendamentos indisponíveis.");

  const body = await req.json().catch(() => ({}));
  const service = await prisma.service.findFirst({
    where: { id: String(body.serviceId || ""), barberId: shop.id, active: true },
  });
  if (!service) return jsonError("Serviço inválido.");
  const startsAt = combineDateTimeSP(String(body.date), String(body.time));
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now()) return jsonError("Horário inválido.");
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  const overlap = await prisma.appointment.findFirst({
    where: {
      barberId: shop.id,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (overlap) return jsonError("Horário já ocupado.");

  let client = await prisma.barberClient.findFirst({
    where: { barberId: shop.id, OR: [{ userId: auth.user.id }, { email: auth.user.email }] },
  });
  if (!client) {
    client = await prisma.barberClient.create({
      data: {
        barberId: shop.id,
        userId: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        phone: auth.user.phone || "",
      },
    });
  } else if (!client.userId) {
    client = await prisma.barberClient.update({
      where: { id: client.id },
      data: { userId: auth.user.id },
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      barberId: shop.id,
      clientId: client.id,
      userId: auth.user.id,
      serviceId: service.id,
      startsAt,
      endsAt,
    },
    include: { service: true },
  });

  const queue = await queueForAppointment(shop.id, appointment);
  notifyShopLive(slug);
  return NextResponse.json({ appointment, queue });
}
