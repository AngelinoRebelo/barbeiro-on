import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { serviceSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const existing = await prisma.service.findFirst({ where: { id, barberId: auth.user.barberProfile.id } });
  if (!existing) return jsonError("Serviço não encontrado.", 404);
  const parsed = serviceSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dados inválidos.");
  const service = await prisma.service.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ service });
}

export async function DELETE(_: Request, ctx: Ctx) {
  const auth = await apiUser();
  if (!auth?.user.barberProfile) return jsonError("Acesso negado.", 403);
  const { id } = await ctx.params;
  const existing = await prisma.service.findFirst({ where: { id, barberId: auth.user.barberProfile.id } });
  if (!existing) return jsonError("Serviço não encontrado.", 404);
  await prisma.service.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
