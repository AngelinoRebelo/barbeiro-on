import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, issueSession, jsonError } from "@/lib/auth";
import { paymentSettingsSchema } from "@/lib/validators";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const p = ctx.user.barberProfile;
  let mpAccess = "";
  try {
    mpAccess = decryptSecret(p.mpAccessEnc);
  } catch {
    mpAccess = "";
  }
  return NextResponse.json({
    profile: {
      name: ctx.user.name,
      shopName: p.shopName,
      slug: p.slug,
      bio: p.bio,
      address: p.address,
      city: p.city,
      openTime: p.openTime,
      closeTime: p.closeTime,
      workDays: p.workDays,
      pixKey: p.pixKey,
      pixKeyType: p.pixKeyType,
      mpPublicKey: p.mpPublicKey,
      mpAccessToken: maskSecret(mpAccess),
      mpConfigured: Boolean(mpAccess),
      brandAt: p.brandAt?.toISOString() ?? null,
    },
  });
}

export async function PATCH(req: Request) {
  const ctx = await apiUser();
  if (!ctx?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));
  const p = ctx.user.barberProfile;

  const hasName = typeof body.name === "string";
  const name = hasName ? body.name.trim().slice(0, 80) : "";
  if (hasName && name.length < 2) return jsonError("Informe o nome do barbeiro.");

  const shopPatch: Record<string, unknown> = {};
  if (typeof body.shopName === "string" && body.shopName.trim().length >= 2) {
    shopPatch.shopName = body.shopName.trim();
  }
  if (typeof body.bio === "string") shopPatch.bio = body.bio.slice(0, 400);
  if (typeof body.address === "string") shopPatch.address = body.address.slice(0, 160);
  if (typeof body.city === "string") shopPatch.city = body.city.slice(0, 80);
  if (typeof body.openTime === "string") shopPatch.openTime = body.openTime;
  if (typeof body.closeTime === "string") shopPatch.closeTime = body.closeTime;
  if (Array.isArray(body.workDays)) {
    shopPatch.workDays = body.workDays.map((n: unknown) => Number(n)).filter((n: number) => n >= 0 && n <= 6);
  }

  if (body.payments) {
    const parsed = paymentSettingsSchema.safeParse(body.payments);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Pagamento inválido.");
    shopPatch.pixKey = parsed.data.pixKey.trim();
    shopPatch.pixKeyType = parsed.data.pixKeyType;
    shopPatch.mpPublicKey = parsed.data.mpPublicKey.trim();
    if (parsed.data.mpAccessToken && !parsed.data.mpAccessToken.includes("••••")) {
      shopPatch.mpAccessEnc = encryptSecret(parsed.data.mpAccessToken.trim());
    }
  }

  const [profile, user] = await prisma.$transaction([
    prisma.barberProfile.update({
      where: { id: p.id },
      data: shopPatch,
    }),
    name
      ? prisma.user.update({
          where: { id: ctx.user.id },
          data: { name },
        })
      : prisma.user.findUniqueOrThrow({ where: { id: ctx.user.id } }),
  ]);
  await issueSession({ ...user, barberProfile: profile, shop: null });
  return NextResponse.json({ ok: true, slug: profile.slug, name: user.name });
}
