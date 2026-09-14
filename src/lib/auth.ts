import { prisma } from "./prisma";
import { clearSessionCookie, getSession, setSessionCookie, type SessionUser } from "./session";
import { parseFeatures, type FeatureFlags } from "./features";
import { homePath, shopPath } from "./paths";
import { hasAccess } from "./access";
import { redirect } from "next/navigation";
import type { User, BarberProfile, Plan } from "@prisma/client";

const userInclude = {
  barberProfile: { include: { plan: true } },
  shop: true,
} as const;

type FullUser = User & {
  barberProfile: (BarberProfile & { plan: Plan | null }) | null;
  shop: BarberProfile | null;
};

export async function sessionPayload(user: {
  id: string;
  role: SessionUser["role"];
  email: string;
  name: string;
  barberProfile?: { slug: string } | null;
  shop?: { slug: string } | null;
}): Promise<SessionUser> {
  return {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    slug: user.barberProfile?.slug || user.shop?.slug,
  };
}

export async function issueSession(user: Parameters<typeof sessionPayload>[0]) {
  await setSessionCookie(await sessionPayload(user));
}

export function redirectHome(user: Parameters<typeof sessionPayload>[0]) {
  return homePath(user.role, user.barberProfile?.slug || user.shop?.slug) || "/login";
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: userInclude,
  });
  if (!user) {
    await clearSessionCookie();
    redirect("/login");
  }
  if (user.status === "SUSPENDED") {
    await clearSessionCookie();
    redirect("/login?erro=suspenso");
  }
  return { session, user };
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (ctx.user.role !== "ADMIN") redirect(redirectHome(ctx.user));
  return ctx;
}

export async function requireBarber(expectedSlug?: string) {
  const ctx = await requireUser();
  if (ctx.user.role === "ADMIN") redirect("/admin");
  if (ctx.user.role !== "BARBER" || !ctx.user.barberProfile) redirect("/login");
  const profile = ctx.user.barberProfile;
  if (expectedSlug && expectedSlug !== profile.slug) redirect(shopPath(profile.slug, "/painel"));
  if (!profile.approved) redirect(shopPath(profile.slug, "/painel/aguardando"));
  if (!hasAccess(profile.accessUntil)) redirect(shopPath(profile.slug, "/painel/plano"));
  return {
    ...ctx,
    profile,
    features: parseFeatures(profile.features),
  };
}

export async function requireClient(expectedSlug?: string) {
  const ctx = await requireUser();
  if (ctx.user.role === "ADMIN") redirect("/admin");
  if (ctx.user.role === "BARBER") redirect(redirectHome(ctx.user));
  const slug = ctx.user.shop?.slug;
  if (!slug) redirect("/login");
  if (expectedSlug && expectedSlug !== slug) redirect(shopPath(slug, "/portal"));
  return ctx;
}

export async function apiUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: userInclude,
  });
  if (!user || user.status === "SUSPENDED") return null;
  return { session, user };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function apiBarber() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "BARBER" || !ctx.user.barberProfile) return null;
  const profile = ctx.user.barberProfile;
  if (!profile.approved) return { error: jsonError("Barbearia aguardando aprovação.", 403) };
  if (!hasAccess(profile.accessUntil)) return { error: jsonError("Assinatura vencida. Renove o plano.", 402) };
  return {
    ctx,
    profile,
    features: parseFeatures(profile.features),
  };
}

export function hasFeature(features: FeatureFlags, key: keyof FeatureFlags) {
  return features[key] === true;
}

export type Authed = { session: SessionUser };
export type { FullUser };
