import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { parseFeatures } from "@/lib/features";

export async function GET(req: Request) {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";

  const users = await prisma.user.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { barberProfile: { shopName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {},
        role === "ADMIN" || role === "BARBER" || role === "CLIENT" ? { role } : {},
        status === "ACTIVE" || status === "PENDING_EMAIL" || status === "SUSPENDED" ? { status } : {},
      ],
    },
    include: { barberProfile: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      shopName: u.barberProfile?.shopName || null,
      slug: u.barberProfile?.slug || null,
      approved: u.barberProfile?.approved ?? null,
      features: u.barberProfile ? parseFeatures(u.barberProfile.features) : null,
    })),
  });
}
