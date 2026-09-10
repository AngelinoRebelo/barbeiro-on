import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = String(body?.token || "");
  if (!token) return NextResponse.json({ error: "Token inválido." }, { status: 400 });

  const record = await prisma.authToken.findUnique({
    where: { token },
    include: { user: true },
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

  await setSessionCookie({
    sub: record.user.id,
    role: record.user.role,
    email: record.user.email,
    name: record.user.name,
  });

  const dest =
    record.user.role === "ADMIN" ? "/admin" : record.user.role === "BARBER" ? "/painel" : "/portal";
  return NextResponse.json({ ok: true, redirect: dest });
}
