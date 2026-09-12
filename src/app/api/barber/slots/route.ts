import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { hasAccess } from "@/lib/access";
import { combineDateTimeSP } from "@/lib/utils";
import { buildSlots, busyWindows, offeredTimes } from "@/lib/slots";
import { notifyShopLive } from "@/lib/live";

async function barber() {
  const ctx = await apiUser();
  if (!ctx?.user.barberProfile?.approved) return null;
  if (!hasAccess(ctx.user.barberProfile.accessUntil)) return null;
  return ctx.user.barberProfile;
}

export async function GET(req: Request) {
  const profile = await barber();
  if (!profile) return jsonError("Acesso negado.", 403);
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return jsonError("Informe a data.");
  const offered = await offeredTimes(profile.id, date);
  const busy = await busyWindows(profile.id, date);
  const generated = buildSlots(profile.openTime, profile.closeTime, 30, date, busy);
  return NextResponse.json({
    slots: offered,
    generated,
    custom: offered.length > 0,
  });
}

export async function POST(req: Request) {
  const profile = await barber();
  if (!profile) return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));
  const date = String(body.date || "");
  if (!date) return jsonError("Informe a data.");

  if (body.action === "generate") {
    const busy = await busyWindows(profile.id, date);
    const times = buildSlots(profile.openTime, profile.closeTime, 30, date, busy);
    await prisma.availabilitySlot.deleteMany({
      where: {
        barberId: profile.id,
        startsAt: { gte: new Date(`${date}T00:00:00-03:00`), lt: new Date(`${date}T23:59:59-03:00`) },
      },
    });
    if (times.length) {
      await prisma.availabilitySlot.createMany({
        data: times.map((time) => ({ barberId: profile.id, startsAt: combineDateTimeSP(date, time) })),
        skipDuplicates: true,
      });
    }
    notifyShopLive(profile.slug);
    return NextResponse.json({ ok: true, count: times.length });
  }

  const time = String(body.time || "");
  if (!time) return jsonError("Informe o horário.");
  const startsAt = combineDateTimeSP(date, time);
  if (Number.isNaN(startsAt.getTime())) return jsonError("Horário inválido.");
  const slot = await prisma.availabilitySlot.upsert({
    where: { barberId_startsAt: { barberId: profile.id, startsAt } },
    update: {},
    create: { barberId: profile.id, startsAt },
  });
  notifyShopLive(profile.slug);
  return NextResponse.json({ slot });
}

export async function DELETE(req: Request) {
  const profile = await barber();
  if (!profile) return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));
  if (body.action === "clear") {
    const date = String(body.date || "");
    if (!date) return jsonError("Informe a data.");
    await prisma.availabilitySlot.deleteMany({
      where: {
        barberId: profile.id,
        startsAt: { gte: new Date(`${date}T00:00:00-03:00`), lt: new Date(`${date}T23:59:59-03:00`) },
      },
    });
    notifyShopLive(profile.slug);
    return NextResponse.json({ ok: true });
  }
  const id = String(body.id || "");
  if (!id) return jsonError("Horário inválido.");
  await prisma.availabilitySlot.deleteMany({ where: { id, barberId: profile.id } });
  notifyShopLive(profile.slug);
  return NextResponse.json({ ok: true });
}
