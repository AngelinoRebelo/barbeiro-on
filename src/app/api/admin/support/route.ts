import { jsonError } from "@/lib/auth";
import { listSupportTickets, serializeTicket, setSupportStatus } from "@/lib/support";
import { requestActor } from "@/lib/support-http";

export async function GET(req: Request) {
  const actor = await requestActor(req);
  if (!actor || actor.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const tickets = await listSupportTickets(actor);
  return Response.json({ tickets: tickets.map((t) => serializeTicket(t, actor)) });
}

export async function PATCH(req: Request) {
  const actor = await requestActor(req);
  if (!actor || actor.role !== "ADMIN") return jsonError("Acesso negado.", 403);
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  const status = body.status === "DONE" || body.status === "CLOSED" ? "CLOSED" : "OPEN";
  try {
    const ticket = await setSupportStatus(id, actor, status);
    return Response.json({ ok: true, ticket });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Não foi possível atualizar.");
  }
}
