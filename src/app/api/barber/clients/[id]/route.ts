import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { clientSchema } from "@/lib/validators";
import { parseFeatures } from "@/lib/features";
import { removeShopClientAccount } from "@/lib/clients";
import { hasAccess } from "@/lib/access";

type Ctx = { params: Promise<{ id: string }> };

async function scoped(id: string) {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "BARBER" || !ctx.user.barberProfile) return null;
  if (!hasAccess(ctx.user.barberProfile.accessUntil)) return null;
  const features = parseFeatures(ctx.user.barberProfile.features);
  const client = await prisma.barberClient.findFirst({
    where: { id, barberId: ctx.user.barberProfile.id },
  });
  return { ctx, features, client, profile: ctx.user.barberProfile };
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const boxed = await scoped(id);
  if (!boxed?.client) return jsonError("Cliente não encontrado.", 404);
  if (!boxed.features.clients) return jsonError("Módulo de clientes desativado.", 403);
  const parsed = clientSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dados inválidos.");
  const client = await prisma.barberClient.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ client });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const boxed = await scoped(id);
  if (!boxed?.client) return jsonError("Cliente não encontrado.", 404);
  const { client, profile } = boxed;
  await prisma.barberClient.delete({ where: { id } });
  await removeShopClientAccount({
    barberId: profile.id,
    userId: client.userId,
    email: client.email,
  });
  return NextResponse.json({ ok: true });
}
