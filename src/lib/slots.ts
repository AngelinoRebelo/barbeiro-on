import { prisma } from "@/lib/prisma";
import { parseHm, hm, combineDateTimeSP } from "@/lib/utils";

export function buildSlots(openTime: string, closeTime: string, durationMin: number, date: string, busy: { startsAt: Date; endsAt: Date }[]) {
  const open = parseHm(openTime);
  const close = parseHm(closeTime);
  const startMin = open.h * 60 + open.m;
  const endMin = close.h * 60 + close.m;
  const slots: string[] = [];
  for (let m = startMin; m + durationMin <= endMin; m += durationMin) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    const time = `${hh}:${mm}`;
    const startsAt = new Date(`${date}T${time}:00-03:00`);
    const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);
    const blocked = busy.some((b) => b.startsAt < endsAt && b.endsAt > startsAt);
    if (!blocked && startsAt.getTime() > Date.now()) slots.push(time);
  }
  return slots;
}

export async function busyWindows(barberId: string, date: string) {
  return prisma.appointment.findMany({
    where: {
      barberId,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      startsAt: { gte: new Date(`${date}T00:00:00-03:00`), lt: new Date(`${date}T23:59:59-03:00`) },
    },
    select: { startsAt: true, endsAt: true },
  });
}

export async function offeredTimes(barberId: string, date: string) {
  const rows = await prisma.availabilitySlot.findMany({
    where: {
      barberId,
      startsAt: { gte: new Date(`${date}T00:00:00-03:00`), lt: new Date(`${date}T23:59:59-03:00`) },
    },
    orderBy: { startsAt: "asc" },
  });
  return rows.map((row) => ({ id: row.id, time: hm(row.startsAt), startsAt: row.startsAt }));
}

export async function slotsFor(
  barberId: string,
  date: string,
  durationMin: number,
  openTime: string,
  closeTime: string,
  workDays: number[],
) {
  const day = new Date(`${date}T12:00:00-03:00`).getDay();
  if (!workDays.includes(day)) return [];
  const busy = await busyWindows(barberId, date);
  const offered = await offeredTimes(barberId, date);
  if (offered.length) {
    return offered
      .map((slot) => slot.time)
      .filter((time) => {
        const startsAt = combineDateTimeSP(date, time);
        if (startsAt.getTime() <= Date.now()) return false;
        const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);
        return !busy.some((b) => b.startsAt < endsAt && b.endsAt > startsAt);
      });
  }
  return buildSlots(openTime, closeTime, durationMin, date, busy);
}
