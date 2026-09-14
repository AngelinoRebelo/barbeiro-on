import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { canReadTicket, serializeTicket, setSupportStatus } from "@/lib/support";
import { requestActor } from "@/lib/support-http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const actor = await requestActor(req);
  if (!actor) return jsonError("Entre na conta ou informe a chave da conversa.", 401);
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) return jsonError("Chamado não encontrado.", 404);
  if (!canReadTicket(ticket, actor)) return jsonError("Acesso negado.", 403);
  return Response.json({ ticket: serializeTicket(ticket, actor) });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const incoming = await req.json().catch(() => ({}));
  const actor = await requestActor(req, incoming);
  if (!actor) return jsonError("Acesso negado.", 401);
  const status = incoming.status === "OPEN" ? "OPEN" : "CLOSED";
  try {
    const ticket = await setSupportStatus(id, actor, status);
    return Response.json({ ok: true, ticket: serializeTicket(ticket, actor) });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Não foi possível atualizar.", err instanceof Error && err.message === "Acesso negado." ? 403 : 400);
  }
}
