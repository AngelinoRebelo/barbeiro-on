import { jsonError } from "@/lib/auth";
import { createSupportTicket, listSupportTickets, serializeTicket } from "@/lib/support";
import { requestActor } from "@/lib/support-http";

export async function GET(req: Request) {
  const actor = await requestActor(req);
  if (!actor || (!actor.id && !actor.guestKey && actor.role !== "ADMIN")) {
    return jsonError("Entre na conta ou informe a conversa.", 401);
  }
  const tickets = await listSupportTickets(actor);
  return Response.json({
    me: { role: actor.role, name: actor.name, email: actor.email },
    tickets: tickets.map((t) => serializeTicket(t, actor)),
  });
}

export async function POST(req: Request) {
  const incoming = await req.json().catch(() => ({}));
  const actor = await requestActor(req, incoming);
  if (!actor) return jsonError("Informe nome, e-mail e a mensagem, ou entre na sua conta.");
  if (incoming.name) actor.name = String(incoming.name).trim().slice(0, 80) || actor.name;
  if (incoming.email) actor.email = String(incoming.email).trim().toLowerCase() || actor.email;
  const body = String(incoming.body || incoming.message || "").trim();
  try {
    const ticket = await createSupportTicket(actor, body);
    return Response.json({ ok: true, id: ticket.id, guestKey: ticket.guestKey, ticket: serializeTicket(ticket, { ...actor, guestKey: ticket.guestKey || actor.guestKey }) });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Não foi possível abrir o chamado.");
  }
}
