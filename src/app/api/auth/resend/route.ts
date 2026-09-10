import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerifyEmail } from "@/lib/brevo";
import { randomToken } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "")
    .toLowerCase()
    .trim();
  if (!email) return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ ok: true });
  if (user.emailVerified) return NextResponse.json({ ok: true, message: "Conta já confirmada." });

  const token = randomToken();
  await prisma.authToken.deleteMany({ where: { userId: user.id, type: "EMAIL_VERIFY" } });
  await prisma.authToken.create({
    data: {
      userId: user.id,
      type: "EMAIL_VERIFY",
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  await sendVerifyEmail(user.email, user.name, token);
  return NextResponse.json({ ok: true, message: "Novo e-mail enviado." });
}
