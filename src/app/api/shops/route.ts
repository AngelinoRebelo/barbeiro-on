import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFeatures } from "@/lib/features";

export async function GET() {
  const shops = await prisma.barberProfile.findMany({
    where: { approved: true, user: { status: "ACTIVE" } },
    include: { user: { select: { name: true } }, services: { where: { active: true }, take: 3 } },
    orderBy: { shopName: "asc" },
    take: 60,
  });
  return NextResponse.json({
    shops: shops
      .filter((s) => parseFeatures(s.features).publicShop)
      .map((s) => ({
        slug: s.slug,
        shopName: s.shopName,
        city: s.city,
        barberName: s.user.name,
        bio: s.bio,
        fromCents: s.services[0]?.priceCents ?? null,
      })),
  });
}
