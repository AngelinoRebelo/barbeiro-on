import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueSession, redirectHome } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = String(body?.token || "");
  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  const record = await prisma.authToken.findUnique({
    where: { token },
    include: { user: { include: { barberProfile: true, shop: true } } },
  });
  if (!record || record.type !== "EMAIL_VERIFY" || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado ou inválido." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { status: "ACTIVE", emailVerified: new Date() },
    }),
    prisma.authToken.deleteMany({ where: { userId: record.userId, type: "EMAIL_VERIFY" } }),
  ]);

  await issueSession(record.user);
  return NextResponse.json({ ok: true, redirect: redirectHome(record.user) });
}
