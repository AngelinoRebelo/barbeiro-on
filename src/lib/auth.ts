import { prisma } from "./prisma";
import { getSession, type SessionUser } from "./session";
import { parseFeatures, type FeatureFlags } from "./features";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { barberProfile: true },
  });
  if (!user) redirect("/login");
  if (user.status === "SUSPENDED") redirect("/login?erro=suspenso");
  return { session, user };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.user.role !== "ADMIN") redirect("/painel");
  return ctx;
}

export async function requireBarber() {
  const ctx = await requireUser();
  if (ctx.user.role === "ADMIN") redirect("/admin");
  if (ctx.user.role !== "BARBER" || !ctx.user.barberProfile) redirect("/portal");
  if (!ctx.user.barberProfile.approved) redirect("/painel/aguardando");
  return {
    ...ctx,
    profile: ctx.user.barberProfile,
    features: parseFeatures(ctx.user.barberProfile.features),
  };
}

export async function requireClient() {
  const ctx = await requireUser();
  if (ctx.user.role === "ADMIN") redirect("/admin");
  if (ctx.user.role === "BARBER") redirect("/painel");
  return ctx;
}

export async function apiUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { barberProfile: true },
  });
  if (!user || user.status === "SUSPENDED") return null;
  return { session, user };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function hasFeature(features: FeatureFlags, key: keyof FeatureFlags) {
  return features[key] === true;
}

export type Authed = { session: SessionUser };
