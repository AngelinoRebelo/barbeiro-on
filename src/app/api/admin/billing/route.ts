import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/platform";
import { paymentSettingsSchema } from "@/lib/validators";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const s = await getPlatformSettings();
  let mp = "";
  try {
    mp = decryptSecret(s.mpAccessEnc);
  } catch {
    mp = "";
  }
  return NextResponse.json({
    trialDays: s.trialDays,
    billing: {
      pixKey: s.pixKey,
      pixKeyType: s.pixKeyType,
      mpPublicKey: s.mpPublicKey,
      mpAccessToken: maskSecret(mp),
      mpConfigured: Boolean(mp),
    },
  });
}

export async function PATCH(req: Request) {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));

  if (body.trialDays !== undefined && body.pixKeyType === undefined) {
    const trialDays = Math.floor(Number(body.trialDays));
    if (!Number.isFinite(trialDays) || trialDays < 0 || trialDays > 3650) {
      return jsonError("Informe entre 0 e 3650 dias de teste.");
    }
    await prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: { trialDays },
      create: { id: "platform", trialDays },
    });
    return NextResponse.json({ ok: true, trialDays });
  }

  const parsed = paymentSettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Dados inválidos.");
  const data: { pixKey: string; pixKeyType: typeof parsed.data.pixKeyType; mpPublicKey: string; mpAccessEnc?: string } = {
    pixKey: parsed.data.pixKey.trim(),
    pixKeyType: parsed.data.pixKeyType,
    mpPublicKey: parsed.data.mpPublicKey.trim(),
  };
  if (parsed.data.mpAccessToken && !parsed.data.mpAccessToken.includes("••••")) {
    data.mpAccessEnc = encryptSecret(parsed.data.mpAccessToken.trim());
  }
  await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: data,
    create: { id: "platform", ...data },
  });
  return NextResponse.json({ ok: true });
}
