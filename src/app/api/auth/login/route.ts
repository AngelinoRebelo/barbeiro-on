import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/password";
import { issueSession, redirectHome } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const shopSlug = String(body?.shopSlug || "")
    .toLowerCase()
    .trim();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { barberProfile: true, shop: true },
  });
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

  if (shopSlug) {
    if (user.role === "CLIENT" && user.shop?.slug !== shopSlug) {
      return NextResponse.json({ error: "Esta conta não pertence a esta barbearia." }, { status: 403 });
    }
    if (user.role === "BARBER" && user.barberProfile?.slug !== shopSlug) {
      return NextResponse.json({ error: "Esta unidade não é a sua. Use o painel da sua barbearia." }, { status: 403 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Admin entra pela plataforma, não pela loja." }, { status: 403 });
    }
  } else if (user.role === "CLIENT") {
    if (!user.shop?.slug) {
      return NextResponse.json({ error: "Entre pelo link da sua barbearia." }, { status: 403 });
    }
  }

  await issueSession(user);
  return NextResponse.json({ ok: true, redirect: redirectHome(user) });
}
