import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFeatures } from "@/lib/features";
import { getPlatformSettings } from "@/lib/platform";

export const dynamic = "force-dynamic";

export async function GET() {
  const [plans, platform] = await Promise.all([
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    getPlatformSettings(),
  ]);
  return NextResponse.json(
    {
      trialDays: platform.trialDays,
      plans: plans.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        interval: p.interval,
        durationDays: p.durationDays,
        features: parseFeatures(p.features),
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
