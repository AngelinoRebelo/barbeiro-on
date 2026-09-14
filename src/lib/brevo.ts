import { appUrl } from "./utils";

const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "barbeiro_on@outlook.com";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "BARBEIRO_ON";

type Mail = {
  to: string;
  name?: string;
  subject: string;
  html: string;
};

function shell(title: string, body: string, ctaLabel: string, ctaHref: string) {
  return `<!doctype html>
<html lang="pt-BR">
<body style="margin:0;background:#07080c;color:#e9edf5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07080c;padding:32px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#10131c;border:1px solid #d4af3738;border-radius:18px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;letter-spacing:0.28em;font-size:12px;color:#d4af37;">BARBEIRO ON</td></tr>
        <tr><td style="padding:8px 32px 0;font-size:26px;font-weight:700;">${title}</td></tr>
        <tr><td style="padding:16px 32px 8px;color:#8b93a7;font-size:15px;line-height:1.6;">${body}</td></tr>
        <tr><td style="padding:16px 32px 36px;">
          <a href="${ctaHref}" style="display:inline-block;background:#d4af37;color:#07080c;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;">${ctaLabel}</a>
          <p style="margin-top:18px;font-size:12px;color:#8b93a7;">Se o botão não abrir, copie: ${ctaHref}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendBrevoEmail(mail: Mail) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn("[brevo] BREVO_API_KEY ausente. E-mail não enviado:", mail.subject, mail.to);
    return { ok: false, skipped: true as const };
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": key,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: mail.to, name: mail.name || mail.to }],
      subject: mail.subject,
      htmlContent: mail.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[brevo] falha", res.status, text);
    throw new Error("Falha ao enviar e-mail de confirmação.");
  }
  return { ok: true, skipped: false as const };
}

export async function sendVerifyEmail(to: string, name: string, token: string) {
  const href = `${appUrl()}/verificar?token=${token}`;
  return sendBrevoEmail({
    to,
    name,
    subject: "Confirme sua conta · BARBEIRO ON",
    html: shell(
      "Confirme seu acesso",
      `Olá ${name},<br/><br/>Sua conta na plataforma BARBEIRO ON está quase pronta. Confirme o e-mail para ativar login, agenda e pagamentos.`,
      "Confirmar conta",
      href,
    ),
  });
}

export async function sendResetEmail(to: string, name: string, token: string) {
  const href = `${appUrl()}/redefinir?token=${token}`;
  return sendBrevoEmail({
    to,
    name,
    subject: "Redefinir senha · BARBEIRO ON",
    html: shell(
      "Redefinir senha",
      `Olá ${name},<br/><br/>Recebemos um pedido para redefinir sua senha. O link expira em 1 hora.`,
      "Criar nova senha",
      href,
    ),
  });
}

export async function sendApprovedEmail(to: string, name: string, shopName: string) {
  const href = `${appUrl()}/login`;
  return sendBrevoEmail({
    to,
    name,
    subject: "Barbearia aprovada · BARBEIRO ON",
    html: shell(
      "Sua unidade está no ar",
      `Olá ${name},<br/><br/>A unidade <b>${shopName}</b> foi aprovada pelo admin da plataforma. Acesse o painel para cadastrar serviços, clientes, chave PIX e Mercado Pago.`,
      "Abrir painel",
      href,
    ),
  });
}

export async function sendSupportOpenedEmail(to: string, name: string, opts: { who: string; email: string; shop?: string; preview: string; href: string }) {
  const shop = opts.shop ? ` · /${opts.shop}` : "";
  return sendBrevoEmail({
    to,
    name,
    subject: "Nova chamada de suporte · BARBEIRO ON",
    html: shell(
      "Nova chamada aberta",
      `Olá ${name},<br/><br/>Uma conversa de suporte acabou de ser criada.<br/><br/><b>${opts.who}</b> · ${opts.email}${shop}<br/><br/>${opts.preview}`,
      "Abrir conversa",
      opts.href,
    ),
  });
}

export async function sendSupportClosedEmail(to: string, name: string, opts: { who: string; email: string; shop?: string; href: string }) {
  const shop = opts.shop ? ` · /${opts.shop}` : "";
  return sendBrevoEmail({
    to,
    name,
    subject: "Chamada de suporte encerrada · BARBEIRO ON",
    html: shell(
      "Chamada encerrada",
      `Olá ${name},<br/><br/>A conversa com <b>${opts.who}</b> (${opts.email}${shop}) foi encerrada no suporte da plataforma.`,
      "Ver chamados",
      opts.href,
    ),
  });
}

export async function sendSupportReplyEmail(
  to: string,
  name: string,
  opts: { from: string; preview: string; href: string; title?: string; subject?: string },
) {
  return sendBrevoEmail({
    to,
    name,
    subject: opts.subject || "Nova mensagem no suporte · BARBEIRO ON",
    html: shell(
      opts.title || "Nova mensagem",
      `Olá ${name},<br/><br/><b>${opts.from}</b> escreveu na conversa de suporte:<br/><br/>${opts.preview}`,
      "Abrir conversa",
      opts.href,
    ),
  });
}
