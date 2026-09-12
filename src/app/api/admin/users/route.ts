import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { parseFeatures } from "@/lib/features";
import { getPlatformSettings } from "@/lib/platform";
import { daysLeft, isOnTrial } from "@/lib/access";
import type { UserStatus } from "@prisma/client";

export async function GET(req: Request) {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const role = searchParams.get("role") || "";
  const statusParam = searchParams.get("status") || "";
  const platform = await getPlatformSettings();
  const status: UserStatus | undefined =
    statusParam === "ACTIVE" || statusParam === "PENDING_EMAIL" || statusParam === "SUSPENDED"
      ? statusParam
      : undefined;

  const textFilter = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
          { barberProfile: { shopName: { contains: q, mode: "insensitive" as const } } },
          {
            barberProfile: {
              members: {
                some: {
                  role: "CLIENT" as const,
                  OR: [
                    { name: { contains: q, mode: "insensitive" as const } },
                    { email: { contains: q, mode: "insensitive" as const } },
                  ],
                },
              },
            },
          },
          {
            barberProfile: {
              clients: {
                some: {
                  user: {
                    role: "CLIENT" as const,
                    OR: [
                      { name: { contains: q, mode: "insensitive" as const } },
                      { email: { contains: q, mode: "insensitive" as const } },
                    ],
                  },
                },
              },
            },
          },
        ],
      }
    : {};

  const [admins, barbers] = await Promise.all([
    role && role !== "ADMIN"
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: { role: "ADMIN", AND: [textFilter, status ? { status } : {}] },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
    role === "ADMIN"
      ? Promise.resolve([])
      : prisma.user.findMany({
          where: {
            role: "BARBER",
            AND: [
              textFilter,
              status ? { status } : {},
              role === "CLIENT"
                ? {
                    barberProfile: {
                      OR: [
                        { members: { some: { role: "CLIENT" } } },
                        { clients: { some: { user: { role: "CLIENT" } } } },
                      ],
                    },
                  }
                : {},
            ],
          },
          include: {
            barberProfile: {
              include: {
                plan: true,
                members: {
                  where: { role: "CLIENT" },
                  orderBy: { createdAt: "desc" },
                },
                clients: {
                  where: { userId: { not: null } },
                  include: { user: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 200,
        }),
  ]);

  const adminRows = admins.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    shopName: null as string | null,
    slug: null as string | null,
    approved: null as boolean | null,
    features: null,
    planId: null as string | null,
    planName: null as string | null,
    planPriceCents: null as number | null,
    billingCents: null as number | null,
    accessUntil: null as Date | null,
    trialUntil: null as string | null,
    onTrial: false,
    trialDaysLeft: 0,
    clients: [] as { id: string; name: string; email: string; phone: string | null; status: string; createdAt: Date }[],
  }));

  const barberRows = barbers.map((u) => {
    const profile = u.barberProfile;
    const trialUntil = profile?.trialUntil ?? null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
      shopName: profile?.shopName || null,
      slug: profile?.slug || null,
      approved: profile?.approved ?? null,
      features: profile ? parseFeatures(profile.features) : null,
      planId: profile?.planId || null,
      planName: profile?.plan?.name || null,
      planPriceCents: profile?.plan?.priceCents ?? null,
      billingCents: profile?.billingCents ?? null,
      accessUntil: profile?.accessUntil || null,
      trialUntil: trialUntil?.toISOString() ?? null,
      onTrial: isOnTrial(trialUntil),
      trialDaysLeft: daysLeft(trialUntil),
      clients: (() => {
        const nested = new Map<
          string,
          { id: string; name: string; email: string; phone: string | null; status: string; createdAt: Date }
        >();
        for (const c of profile?.members || []) {
          nested.set(c.id, {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            status: c.status,
            createdAt: c.createdAt,
          });
        }
        for (const link of profile?.clients || []) {
          const c = link.user;
          if (!c || c.role !== "CLIENT" || nested.has(c.id)) continue;
          nested.set(c.id, {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            status: c.status,
            createdAt: c.createdAt,
          });
        }
        return [...nested.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      })(),
    };
  });

  return NextResponse.json({
    me: ctx.user.id,
    trialDays: platform.trialDays,
    users: [...barberRows, ...adminRows],
  });
}
