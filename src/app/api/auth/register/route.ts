import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { hashPassword, passwordRules } from "@/lib/password";
import { sendVerifyEmail } from "@/lib/brevo";
import { randomToken } from "@/lib/utils";
import { uniqueSlug, DEFAULT_SERVICES } from "@/lib/barber";
import { parseFeatures } from "@/lib/features";
import { encryptSecret } from "@/lib/crypto";
import { shopPath, shopUrl } from "@/lib/paths";
import { getPlatformSettings } from "@/lib/platform";
import { addDays, newAccountTrialDays } from "@/lib/access";

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

  const passwordHash = await hashPassword(password);
  const token = randomToken();

  if (role === "CLIENT") {
    const shopSlug = parsed.data.shopSlug.trim().toLowerCase();
    if (!shopSlug) return NextResponse.json({ error: "Cadastre-se pelo link da barbearia." }, { status: 400 });
    const shop = await prisma.barberProfile.findUnique({ where: { slug: shopSlug } });
    if (!shop) return NextResponse.json({ error: "Barbearia não encontrada." }, { status: 404 });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      const stillInShop = await prisma.barberClient.findFirst({
        where: {
          barberId: shop.id,
          OR: [{ userId: exists.id }, { email }],
        },
      });
      if (exists.role !== "CLIENT") {
        return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
      }
      if (exists.shopId && exists.shopId !== shop.id) {
        return NextResponse.json({ error: "Este e-mail já está cadastrado em outra barbearia." }, { status: 409 });
      }
      if (stillInShop) {
        return NextResponse.json({ error: "Este e-mail já está cadastrado nesta barbearia." }, { status: 409 });
      }
      await prisma.authToken.deleteMany({ where: { userId: exists.id } });
      await prisma.user.update({
        where: { id: exists.id },
        data: {
          name: name.trim(),
          phone: phone || null,
          passwordHash,
          status: "PENDING_EMAIL",
          emailVerified: null,
          shopId: shop.id,
          tokens: {
            create: { type: "EMAIL_VERIFY", token, expiresAt: new Date(Date.now() + 86400000) },
          },
        },
      });
      await prisma.barberClient.create({
        data: {
          barberId: shop.id,
          userId: exists.id,
          name: name.trim(),
          email,
          phone: phone || "",
        },
      });
      try {
        await sendVerifyEmail(email, name.trim(), token);
      } catch {
        return NextResponse.json(
          { ok: true, slug: shop.slug, message: "Conta reativada nesta barbearia. O e-mail falhou; peça reenvio." },
          { status: 201 },
        );
      }
      return NextResponse.json({
        ok: true,
        slug: shop.slug,
        path: shopPath(shop.slug),
        message: "Enviamos a confirmação. Depois você entra nesta barbearia.",
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: name.trim(),
        phone: phone || null,
        passwordHash,
        role: "CLIENT",
        status: "PENDING_EMAIL",
        shopId: shop.id,
        tokens: {
          create: { type: "EMAIL_VERIFY", token, expiresAt: new Date(Date.now() + 86400000) },
        },
      },
    });
    await prisma.barberClient.create({
      data: {
        barberId: shop.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      },
    });
    try {
      await sendVerifyEmail(email, user.name, token);
    } catch {
      return NextResponse.json(
        { ok: true, slug: shop.slug, message: "Conta criada. O e-mail falhou; peça reenvio." },
        { status: 201 },
      );
    }
    return NextResponse.json({
      ok: true,
      slug: shop.slug,
      path: shopPath(shop.slug),
      message: "Enviamos a confirmação. Depois você entra nesta barbearia.",
    });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });

  const shopName = parsed.data.shopName?.trim();
  if (!shopName) return NextResponse.json({ error: "Informe o nome da barbearia." }, { status: 400 });
  if (!parsed.data.planId) return NextResponse.json({ error: "Escolha um plano." }, { status: 400 });

  const plan = await prisma.plan.findFirst({ where: { id: parsed.data.planId, active: true } });
  if (!plan) return NextResponse.json({ error: "Plano indisponível." }, { status: 400 });

  const slug = await uniqueSlug(shopName);
  const features = parseFeatures(plan.features);
  const mpAccessEnc = parsed.data.mpAccessToken?.trim() ? encryptSecret(parsed.data.mpAccessToken.trim()) : "";
  const platform = await getPlatformSettings();
  const trialDays = newAccountTrialDays(platform.trialDays);
  const trialUntil = addDays(new Date(), trialDays);

  const user = await prisma.user.create({
    data: {
      email,
      name: name.trim(),
      phone: phone || null,
      passwordHash,
      role: "BARBER",
      status: "PENDING_EMAIL",
      tokens: {
        create: { type: "EMAIL_VERIFY", token, expiresAt: new Date(Date.now() + 86400000) },
      },
      barberProfile: {
        create: {
          shopName,
          slug,
          approved: true,
          planId: plan.id,
          features,
          subscriptionStatus: "ACTIVE",
          accessUntil: trialUntil,
          trialUntil,
          pixKey: parsed.data.pixKey?.trim() || "",
          pixKeyType: parsed.data.pixKeyType || "RANDOM",
          mpPublicKey: parsed.data.mpPublicKey?.trim() || "",
          mpAccessEnc,
          services: { create: DEFAULT_SERVICES },
        },
      },
    },
  });

  try {
    await sendVerifyEmail(email, user.name, token);
  } catch {
    return NextResponse.json(
      {
        ok: true,
        slug,
        path: shopPath(slug),
        url: shopUrl(slug),
        message: "Unidade criada. O e-mail falhou; peça reenvio.",
      },
      { status: 201 },
    );
  }

  return NextResponse.json({
    ok: true,
    slug,
    path: shopPath(slug),
    url: shopUrl(slug),
    message: `Unidade criada em ${shopPath(slug)}. Confirme o e-mail enviado por BARBEIRO_ON.`,
  });
}
