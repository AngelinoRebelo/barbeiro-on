import { prisma } from "./prisma";
import { randomToken } from "./utils";
import { appUrl } from "./utils";
import { sendSupportClosedEmail, sendSupportOpenedEmail, sendSupportReplyEmail } from "./brevo";

export type SupportActor = {
  id?: string;
  name: string;
  email: string;
  role: string;
  slug?: string;
  guestKey?: string;
};

const ticketInclude = {
  messages: { orderBy: { createdAt: "asc" as const } },
};

function previewOf(text: string) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.slice(0, 280);
}

function subjectOf(text: string) {
  const line = String(text || "").trim().split("\n")[0] || "Chamado de suporte";
  return line.slice(0, 80);
}

function ticketHref(role: string, shopSlug: string, id: string) {
  const origin = appUrl();
  if (role === "ADMIN") return `${origin}/admin/suporte?id=${id}`;
  if (role === "BARBER" && shopSlug) return `${origin}/${shopSlug}/painel/suporte?id=${id}`;
  if (role === "CLIENT" && shopSlug) return `${origin}/${shopSlug}/portal/suporte?id=${id}`;
  return `${origin}/`;
}

export async function listAdmins() {
  return prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { email: true, name: true },
  });
}

export async function notifyAdminsOpened(ticket: { id: string; name: string; email: string; shopSlug: string; body: string }) {
  const admins = await listAdmins();
  const href = ticketHref("ADMIN", ticket.shopSlug, ticket.id);
  await Promise.allSettled(
    admins.map((admin) =>
      sendSupportOpenedEmail(admin.email, admin.name, {
        who: ticket.name || ticket.email,
        email: ticket.email,
        shop: ticket.shopSlug || undefined,
        preview: previewOf(ticket.body).replace(/&/g, "&amp;").replace(/</g, "&lt;"),
        href,
      }),
    ),
  );
}

export async function notifyAdminsClosed(ticket: { id: string; name: string; email: string; shopSlug: string }) {
  const admins = await listAdmins();
  const href = ticketHref("ADMIN", ticket.shopSlug, ticket.id);
  await Promise.allSettled(
    admins.map((admin) =>
      sendSupportClosedEmail(admin.email, admin.name, {
        who: ticket.name || ticket.email,
        email: ticket.email,
        shop: ticket.shopSlug || undefined,
        href,
      }),
    ),
  );
}

export function canReadTicket(
  ticket: { userId: string | null; email: string; guestKey: string },
  actor: SupportActor | null,
) {
  if (!actor) return false;
  if (actor.role === "ADMIN") return true;
  if (actor.id && ticket.userId && actor.id === ticket.userId) return true;
  if (actor.email && ticket.email && actor.email.toLowerCase() === ticket.email.toLowerCase()) return true;
  if (actor.guestKey && ticket.guestKey && actor.guestKey === ticket.guestKey) return true;
  return false;
}

export async function createSupportTicket(actor: SupportActor, body: string) {
  const text = body.trim().slice(0, 4000);
  if (!text) throw new Error("Escreva uma mensagem antes de enviar.");
  const email = actor.email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Informe um e-mail para retorno, ou entre na sua conta.");

  const guestKey = actor.id ? "" : actor.guestKey || randomToken(16);
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: actor.id,
      name: (actor.name || email).slice(0, 80),
      email,
      role: actor.role || "VISITOR",
      shopSlug: actor.slug || "",
      subject: subjectOf(text),
      body: text,
      status: "OPEN",
      guestKey,
      lastMessageAt: new Date(),
      messages: {
        create: {
          authorId: actor.id,
          authorRole: actor.role || "VISITOR",
          authorName: (actor.name || email).slice(0, 80),
          body: text,
        },
      },
    },
    include: ticketInclude,
  });
  await notifyAdminsOpened(ticket);
  return ticket;
}

export async function addSupportMessage(ticketId: string, actor: SupportActor, body: string) {
  const text = body.trim().slice(0, 4000);
  if (!text) throw new Error("Escreva uma mensagem.");
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado.");
  if (!canReadTicket(ticket, actor)) throw new Error("Acesso negado.");
  if (ticket.status !== "OPEN") throw new Error("Esta conversa está encerrada. Reabra para responder.");

  const message = await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      authorId: actor.id,
      authorRole: actor.role || "VISITOR",
      authorName: (actor.name || actor.email).slice(0, 80),
      body: text,
    },
  });
  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: { lastMessageAt: new Date(), status: "OPEN", closedAt: null },
  });

  const preview = previewOf(text).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  if (actor.role === "ADMIN") {
    await sendSupportReplyEmail(ticket.email, ticket.name || ticket.email, {
      from: actor.name || "Suporte",
      preview,
      href: ticketHref(ticket.role, ticket.shopSlug, ticket.id),
      title: "O suporte respondeu",
      subject: "O suporte respondeu · BARBEIRO ON",
    }).catch(() => undefined);
  } else {
    const admins = await listAdmins();
    const href = ticketHref("ADMIN", ticket.shopSlug, ticket.id);
    await Promise.allSettled(
      admins.map((admin) =>
        sendSupportReplyEmail(admin.email, admin.name, {
          from: actor.name || actor.email,
          preview,
          href,
          title: "Nova mensagem no chamado",
          subject: "Nova mensagem no suporte · BARBEIRO ON",
        }),
      ),
    );
  }

  return message;
}

export async function setSupportStatus(ticketId: string, actor: SupportActor, status: "OPEN" | "CLOSED") {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado.");
  if (!canReadTicket(ticket, actor)) throw new Error("Acesso negado.");
  const next = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      status,
      closedAt: status === "CLOSED" ? new Date() : null,
    },
    include: ticketInclude,
  });
  if (status === "CLOSED" && ticket.status !== "CLOSED") {
    await notifyAdminsClosed(next);
  }
  if (status === "OPEN" && ticket.status === "CLOSED") {
    await notifyAdminsOpened({ ...next, body: next.body || "Conversa reaberta." });
  }
  return next;
}

export async function listSupportTickets(actor: SupportActor) {
  if (actor.role === "ADMIN") {
    return prisma.supportTicket.findMany({
      orderBy: { lastMessageAt: "desc" },
      take: 120,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  }
  if (actor.id) {
    return prisma.supportTicket.findMany({
      where: { OR: [{ userId: actor.id }, { email: actor.email.toLowerCase() }] },
      orderBy: { lastMessageAt: "desc" },
      take: 40,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  }
  if (actor.guestKey) {
    return prisma.supportTicket.findMany({
      where: { guestKey: actor.guestKey },
      orderBy: { lastMessageAt: "desc" },
      take: 40,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
  }
  return [];
}

export function serializeTicket<T extends { guestKey: string }>(ticket: T, actor: SupportActor) {
  return {
    ...ticket,
    guestKey: actor.role === "ADMIN" || !ticket.guestKey ? ticket.guestKey : actor.guestKey === ticket.guestKey ? ticket.guestKey : "",
  };
}
