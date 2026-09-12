import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiUser, jsonError } from "@/lib/auth";
import { sendBrevoEmail } from "@/lib/brevo";
import { appUrl } from "@/lib/utils";

export async function POST(req: Request) {
  const ctx = await apiUser();
  const incoming = await req.json().catch(() => ({}));
  const body = String(incoming.body || "").trim().slice(0, 4000);
  if (!body) return jsonError("Escreva uma mensagem antes de enviar.");

  const name = String(ctx?.user.name || incoming.name || "").trim().slice(0, 80);
  const email = String(ctx?.user.email || incoming.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return jsonError("Informe um e-mail para retorno, ou entre na sua conta.");
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: ctx?.user.id,
      name: name || email,
      email,
      role: ctx?.user.role || "VISITOR",
      shopSlug: ctx?.session.slug || "",
      body,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { email: true, name: true },
  });
  const href = `${appUrl()}/admin/suporte`;
  const html = `Nova mensagem pelo assistente de suporte.<br/><br/><b>${name || email}</b> · ${email}${ticket.shopSlug ? ` · /${ticket.shopSlug}` : ""}<br/><br/>${body.replace(/\n/g, "<br/>")}`;
  await Promise.allSettled(
    admins.map((admin) =>
      sendBrevoEmail({
        to: admin.email,
        name: admin.name,
        subject: "Suporte · BARBEIRO ON",
        html: `<p style="color:#e9edf5">${html}</p><p><a href="${href}" style="color:#d4af37">Abrir chamados</a></p>`,
      }),
    ),
  );

  return NextResponse.json({ ok: true, id: ticket.id });
}
