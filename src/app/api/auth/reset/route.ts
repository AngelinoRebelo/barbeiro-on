import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, passwordRules } from "@/lib/password";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  const rule = passwordRules(password);
  if (rule) return NextResponse.json({ error: rule }, { status: 400 });

  const record = await prisma.authToken.findUnique({ where: { token } });
  if (!record || record.type !== "PASSWORD_RESET" || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "Link expirado ou inválido." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.authToken.deleteMany({ where: { userId: record.userId, type: "PASSWORD_RESET" } }),
  ]);

  return NextResponse.json({ ok: true });
}
