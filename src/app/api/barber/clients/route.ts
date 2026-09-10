import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { clientSchema } from "@/lib/validators";
import { parseFeatures } from "@/lib/features";

async function barberCtx() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "BARBER" || !ctx.user.barberProfile) return null;
  if (!ctx.user.barberProfile.approved) return { error: jsonError("Barbearia aguardando aprovação.", 403) };
  return { ctx, profile: ctx.user.barberProfile, features: parseFeatures(ctx.user.barberProfile.features) };
}

export async function GET() {
  const boxed = await barberCtx();
  if (!boxed) return jsonError("Acesso negado.", 403);
  if ("error" in boxed && boxed.error) return boxed.error;
  if (!("profile" in boxed)) return jsonError("Acesso negado.", 403);
  if (!boxed.features.clients) return jsonError("Módulo de clientes desativado.", 403);

  const clients = await prisma.barberClient.findMany({
    where: { barberId: boxed.profile.id },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return NextResponse.json({ clients });
}

export async function POST(req: Request) {
  const boxed = await barberCtx();
  if (!boxed) return jsonError("Acesso negado.", 403);
  if ("error" in boxed && boxed.error) return boxed.error;
  if (!("profile" in boxed)) return jsonError("Acesso negado.", 403);
  if (!boxed.features.clients) return jsonError("Módulo de clientes desativado.", 403);

  const parsed = clientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message || "Dados inválidos.");

  const client = await prisma.barberClient.create({
    data: {
      barberId: boxed.profile.id,
      createdById: boxed.ctx.user.id,
      name: parsed.data.name.trim(),
      phone: parsed.data.phone || "",
      email: parsed.data.email || "",
      notes: parsed.data.notes || "",
    },
  });
  return NextResponse.json({ client });
}
