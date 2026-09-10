import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/brevo";
import { randomToken } from "@/lib/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email || "")
    .toLowerCase()
    .trim();
  if (!email) return NextResponse.json({ error: "Informe o e-mail." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = randomToken();
    await prisma.authToken.deleteMany({ where: { userId: user.id, type: "PASSWORD_RESET" } });
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
    await sendResetEmail(user.email, user.name, token);
  }
  return NextResponse.json({ ok: true, message: "Se o e-mail existir, enviaremos o link." });
}
