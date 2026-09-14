import { jsonError } from "@/lib/auth";
import { addSupportMessage } from "@/lib/support";
import { requestActor } from "@/lib/support-http";
import { prisma } from "@/lib/prisma";
import { canReadTicket } from "@/lib/support";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const incoming = await req.json().catch(() => ({}));
  const actor = await requestActor(req, incoming);
  if (!actor) return jsonError("Acesso negado.", 401);
  const body = String(incoming.body || incoming.message || "").trim();
  try {
    const message = await addSupportMessage(id, actor, body);
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!ticket || !canReadTicket(ticket, actor)) return jsonError("Acesso negado.", 403);
    return Response.json({ ok: true, message, ticket });
  } catch (err) {
    const text = err instanceof Error ? err.message : "Não foi possível enviar.";
    return jsonError(text, text === "Acesso negado." ? 403 : 400);
  }
}
