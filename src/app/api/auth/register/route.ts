import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, passwordRules } from "@/lib/password";
import { sendVerifyEmail } from "@/lib/brevo";
import { randomToken } from "@/lib/utils";
import { uniqueSlug, DEFAULT_SERVICES } from "@/lib/barber";
import { DEFAULT_FEATURES } from "@/lib/features";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
  }

  const { name, password, role, phone } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();
  const rule = passwordRules(password);
  if (rule) return NextResponse.json({ error: rule }, { status: 400 });

  if (role === "BARBER" && !parsed.data.shopName?.trim()) {
    return NextResponse.json({ error: "Informe o nome da barbearia." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const token = randomToken();
  const shopName = parsed.data.shopName?.trim() || `${name} Barber`;

  const user = await prisma.user.create({
    data: {
      email,
      name: name.trim(),
      phone: phone || null,
      passwordHash,
      role,
      status: "PENDING_EMAIL",
      tokens: {
        create: {
          type: "EMAIL_VERIFY",
          token,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
      ...(role === "BARBER"
        ? {
            barberProfile: {
              create: {
                shopName,
                slug: await uniqueSlug(shopName),
                features: DEFAULT_FEATURES,
                services: { create: DEFAULT_SERVICES },
              },
            },
          }
        : {}),
    },
  });

  try {
    await sendVerifyEmail(email, user.name, token);
  } catch {
    return NextResponse.json(
      { error: "Conta criada, mas o e-mail de confirmação falhou. Peça reenvio." },
      { status: 201 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Enviamos um e-mail de confirmação por BARBEIRO_ON.",
  });
}
