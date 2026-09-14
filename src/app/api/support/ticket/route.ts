import { createSupportTicket } from "@/lib/support";
import { requestActor } from "@/lib/support-http";
import { jsonError } from "@/lib/auth";

export async function POST(req: Request) {
  const incoming = await req.json().catch(() => ({}));
  const actor = await requestActor(req, incoming);
  if (!actor) return jsonError("Informe um e-mail para retorno, ou entre na sua conta.");
  if (incoming.name) actor.name = String(incoming.name).trim().slice(0, 80) || actor.name;
  if (incoming.email) actor.email = String(incoming.email).trim().toLowerCase() || actor.email;
  try {
    const ticket = await createSupportTicket(actor, String(incoming.body || ""));
    return Response.json({ ok: true, id: ticket.id, guestKey: ticket.guestKey });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Não foi possível enviar.");
  }
}
