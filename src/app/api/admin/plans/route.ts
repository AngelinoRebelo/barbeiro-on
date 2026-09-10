import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { planSchema } from "@/lib/validators";
import { parseFeatures, DEFAULT_FEATURES } from "@/lib/features";
import { slugify } from "@/lib/utils";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    plans: plans.map((p) => ({ ...p, features: parseFeatures(p.features) })),
  });
}

export async function POST(req: Request) {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const parsed = planSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Dados inválidos.");
  const slug = slugify(parsed.data.slug || parsed.data.name);
  const plan = await prisma.plan.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description || "",
      priceCents: parsed.data.priceCents,
      interval: parsed.data.interval,
      active: parsed.data.active,
      sortOrder: parsed.data.sortOrder,
      features: { ...DEFAULT_FEATURES, ...parsed.data.features },
    },
  });
  return NextResponse.json({ plan });
}
