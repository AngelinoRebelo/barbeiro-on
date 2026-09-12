import { prisma } from "@/lib/prisma";
import { extendAccess } from "@/lib/access";
import { parseFeatures } from "@/lib/features";

export function subscriptionAmountCents(profile: {
  billingCents?: number | null;
  plan?: { priceCents: number } | null;
}) {
  if (profile.billingCents != null) return Math.max(0, profile.billingCents);
  return Math.max(0, profile.plan?.priceCents ?? 0);
}

const pendingMpReset = {
  mpPreferenceId: null,
  mpInitPoint: null,
  mpPaymentId: null,
  pixPayload: null,
  pixTxid: null,
};

export async function lastPaidSubscription(barberId: string) {
  return prisma.payment.findFirst({
    where: { barberId, kind: "SUBSCRIPTION", status: "PAID" },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function closePendingSubscriptions(barberId: string) {
  await prisma.payment.updateMany({
    where: { barberId, kind: "SUBSCRIPTION", status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

export async function syncPendingSubscription(barberId: string, amountCents: number) {
  const pending = await prisma.payment.findMany({
    where: { barberId, kind: "SUBSCRIPTION", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (amountCents <= 0) {
    if (pending.length) {
      await prisma.payment.updateMany({
        where: { id: { in: pending.map((row) => row.id) } },
        data: { status: "CANCELLED" },
      });
    }
    return null;
  }
  const [keep, ...extras] = pending;
  if (extras.length) {
    await prisma.payment.updateMany({
      where: { id: { in: extras.map((row) => row.id) } },
      data: { status: "CANCELLED" },
    });
  }
  if (!keep) return null;
  if (keep.amountCents === amountCents) return keep;
  return prisma.payment.update({
    where: { id: keep.id },
    data: { amountCents, ...pendingMpReset },
  });
}

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
  const updated = await prisma.barberProfile.update({
    where: { id: barberId },
    data: {
      planId: plan.id,
      features: parseFeatures(plan.features),
      accessUntil,
      subscriptionStatus: "ACTIVE",
    },
    include: { plan: true },
  });
  await syncPendingSubscription(barberId, subscriptionAmountCents(updated));
  return updated;
}

export async function grantPaidPeriod(barberId: string) {
  const profile = await prisma.barberProfile.findUnique({
    where: { id: barberId },
    include: { plan: true },
  });
  if (!profile) return null;
  const days = profile.plan?.durationDays ?? 30;
  const accessUntil = extendAccess(profile.accessUntil, days);
  return prisma.barberProfile.update({
    where: { id: barberId },
    data: { accessUntil, trialUntil: null, subscriptionStatus: "ACTIVE" },
  });
}
