import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }
  if (user.status === "SUSPENDED") {
    return NextResponse.json({ error: "Conta suspensa pelo administrador." }, { status: 403 });
  }
  if (user.status === "PENDING_EMAIL" || !user.emailVerified) {
    return NextResponse.json(
      { error: "Confirme seu e-mail antes de entrar.", code: "UNVERIFIED" },
      { status: 403 },
    );
  }

  await setSessionCookie({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  const dest = user.role === "ADMIN" ? "/admin" : user.role === "BARBER" ? "/painel" : "/portal";
  return NextResponse.json({ ok: true, redirect: dest });
}
