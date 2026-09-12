import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    select: { brand: { select: { mime: true, data: true } } },
  });
  if (!shop?.brand) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(Uint8Array.from(shop.brand.data), {
    headers: {
      "Content-Type": shop.brand.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
