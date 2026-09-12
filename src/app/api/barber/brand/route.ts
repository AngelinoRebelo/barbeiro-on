import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";

const MAX_BYTES = 1_500_000;

function sniffImageMime(buf: Buffer) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function POST(req: Request) {
  const ctx = await apiUser();
  if (!ctx?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File) || file.size < 32) return jsonError("Envie uma imagem JPG, PNG ou WEBP.");
  if (file.size > MAX_BYTES) return jsonError("A imagem deve ter no máximo 1,5 MB.");
  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffImageMime(data);
  if (!mime) return jsonError("Use JPG, PNG ou WEBP.");
  const brandAt = new Date();
  const barberId = ctx.user.barberProfile.id;
  await prisma.$transaction([
    prisma.shopBrand.upsert({
      where: { barberId },
      update: { mime, data },
      create: { barberId, mime, data },
    }),
    prisma.barberProfile.update({
      where: { id: barberId },
      data: { brandAt },
    }),
  ]);
  return NextResponse.json({
    ok: true,
    brandAt: brandAt.toISOString(),
    url: `/api/shop/${ctx.user.barberProfile.slug}/brand?v=${brandAt.getTime()}`,
  });
}

export async function DELETE() {
  const ctx = await apiUser();
  if (!ctx?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const barberId = ctx.user.barberProfile.id;
  await prisma.$transaction([
    prisma.shopBrand.deleteMany({ where: { barberId } }),
    prisma.barberProfile.update({ where: { id: barberId }, data: { brandAt: null } }),
  ]);
  return NextResponse.json({ ok: true });
}
