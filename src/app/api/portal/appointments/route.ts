import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "CLIENT") return jsonError("Acesso negado.", 403);
  const appointments = await prisma.appointment.findMany({
    where: { userId: ctx.user.id },
    include: { service: true, barber: { select: { shopName: true, slug: true, city: true } } },
    orderBy: { startsAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ appointments });
}
