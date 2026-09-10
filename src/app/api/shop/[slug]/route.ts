import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFeatures } from "@/lib/features";
import { jsonError } from "@/lib/auth";
import { slotsFor } from "@/lib/slots";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true, status: true } },
      services: { where: { active: true }, orderBy: { priceCents: "asc" } },
    },
  });
  if (!shop || !shop.approved || shop.user.status !== "ACTIVE") return jsonError("Barbearia não encontrada.", 404);
  const features = parseFeatures(shop.features);
  if (!features.publicShop) return jsonError("Página pública desativada.", 404);

  const date = new URL(req.url).searchParams.get("date");
  const serviceId = new URL(req.url).searchParams.get("serviceId");
  let slots: string[] = [];
  if (date && serviceId) {
    const service = shop.services.find((s) => s.id === serviceId);
    if (service) {
      slots = await slotsFor(shop.id, date, service.durationMin, shop.openTime, shop.closeTime, shop.workDays);
    }
  }

  return NextResponse.json({
    shop: {
      shopName: shop.shopName,
      slug: shop.slug,
      bio: shop.bio,
      address: shop.address,
      city: shop.city,
      barberName: shop.user.name,
      openTime: shop.openTime,
      closeTime: shop.closeTime,
      workDays: shop.workDays,
      pix: features.pix && Boolean(shop.pixKey),
      mercadopago: features.mercadopago && Boolean(shop.mpAccessEnc),
      services: shop.services,
    },
    slots,
  });
}
