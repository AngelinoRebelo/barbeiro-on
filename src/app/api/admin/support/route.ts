import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";

export async function GET() {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return NextResponse.json({ tickets });
}

export async function PATCH(req: Request) {
  const ctx = await apiUser();
  if (!ctx || ctx.user.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const status = body.status === "DONE" ? "DONE" : "OPEN";
  const ticket = await prisma.supportTicket.findUnique({ where: { id } });
  if (!ticket) return jsonError("Chamado não encontrado.", 404);
  await prisma.supportTicket.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}
