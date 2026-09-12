import { prisma } from "@/lib/prisma";
import { ymd, startOfDaySP } from "@/lib/utils";
import type { QueueInfo } from "@/lib/queue-view";

export type { QueueInfo } from "@/lib/queue-view";
export { queueLabel, paidFrom } from "@/lib/queue-view";

const WAITING = ["SCHEDULED", "CONFIRMED"] as const;

export async function queueForAppointment(barberId: string, appointment: { id: string; startsAt: Date }): Promise<QueueInfo> {
  const day = ymd(appointment.startsAt);
  const dayStart = startOfDaySP(day);
  const dayEnd = new Date(`${day}T23:59:59.999-03:00`);
  const waiting = await prisma.appointment.findMany({
    where: {
      barberId,
      status: { in: [...WAITING] },
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    select: { id: true },
    orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
  });
  const index = waiting.findIndex((row) => row.id === appointment.id);
  if (index < 0) {
    return { position: 0, ahead: 0, total: waiting.length, waiting: false };
  }
  return {
    position: index + 1,
    ahead: index,
    total: waiting.length,
    waiting: true,
  };
}
