import { prisma } from "@/lib/prisma";
import { extendAccess } from "@/lib/access";
import { parseFeatures } from "@/lib/features";

export async function addAccessDays(barberId: string, days: number) {
  const profile = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!profile) return null;
  const accessUntil = extendAccess(profile.accessUntil, days);
  return prisma.barberProfile.update({
    where: { id: barberId },
    data: { accessUntil, subscriptionStatus: "ACTIVE" },
  });
}

export async function assignPlan(barberId: string, planId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return null;
  const profile = await prisma.barberProfile.findUnique({ where: { id: barberId } });
  if (!profile) return null;
  const accessUntil = extendAccess(profile.accessUntil, plan.durationDays);
  return prisma.barberProfile.update({
    where: { id: barberId },
    data: {
      planId: plan.id,
      features: parseFeatures(plan.features),
      accessUntil,
      subscriptionStatus: "ACTIVE",
    },
  });
}

export async function grantPaidPeriod(barberId: string) {
  const profile = await prisma.barberProfile.findUnique({
    where: { id: barberId },
    include: { plan: true },
  });
  if (!profile) return null;
  const days = profile.plan?.durationDays ?? 30;
  return addAccessDays(barberId, days);
}
