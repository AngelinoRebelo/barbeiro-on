import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/password";
import { issueSession, redirectHome } from "@/lib/auth";
import { publicOrigin } from "@/lib/utils";

function safeNext(raw: string, shopSlug: string) {
  if (!raw.startsWith("/") || raw.startsWith("//")) return "";
  if (shopSlug && !raw.startsWith(`/${shopSlug}`)) return "";
  return raw;
}

async function credentialsFrom(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return {
      form: true,
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      shopSlug: String(form.get("shopSlug") || "").toLowerCase().trim(),
      next: String(form.get("next") || ""),
    };
  }
  const body = await req.json().catch(() => ({}));
  return {
    form: false,
    email: String(body.email || ""),
    password: String(body.password || ""),
    shopSlug: String(body.shopSlug || "").toLowerCase().trim(),
    next: String(body.next || ""),
  };
}

function fail(form: boolean, req: Request, message: string, shopSlug: string, status = 401) {
  if (!form) return NextResponse.json({ error: message }, { status });
  const path = shopSlug ? `/${shopSlug}/login` : "/login";
  const url = new URL(path, publicOrigin(req));
  url.searchParams.set("erro", message);
  return NextResponse.redirect(url, 303);
}

export async function POST(req: Request) {
  const input = await credentialsFrom(req);
  const parsed = loginSchema.safeParse({ email: input.email, password: input.password });
  if (!parsed.success) {
    return fail(input.form, req, parsed.error.issues[0]?.message || "Dados inválidos.", input.shopSlug, 400);
  }

  const email = parsed.data.email.toLowerCase().trim();
  const shopSlug = input.shopSlug;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { barberProfile: true, shop: true },
  });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail(input.form, req, "E-mail ou senha inválidos.", shopSlug);
  }
  if (user.status === "SUSPENDED") {
    return fail(input.form, req, "Conta suspensa pelo administrador.", shopSlug, 403);
  }
  if (user.status === "PENDING_EMAIL" || !user.emailVerified) {
    return fail(input.form, req, "Confirme seu e-mail antes de entrar.", shopSlug, 403);
  }

  if (shopSlug) {
    if (user.role === "CLIENT" && user.shop?.slug !== shopSlug) {
      return fail(input.form, req, "Esta conta não pertence a esta barbearia.", shopSlug, 403);
    }
    if (user.role === "BARBER" && user.barberProfile?.slug !== shopSlug) {
      return fail(input.form, req, "Esta unidade não é a sua. Use o painel da sua barbearia.", shopSlug, 403);
    }
    if (user.role === "ADMIN") {
      return fail(input.form, req, "Admin entra pela plataforma, não pela loja.", shopSlug, 403);
    }
  } else if (user.role === "CLIENT") {
    if (!user.shop?.slug) {
      return fail(input.form, req, "Entre pelo link da sua barbearia.", shopSlug, 403);
    }
  }

  await issueSession(user);
  const next = safeNext(input.next, user.barberProfile?.slug || user.shop?.slug || shopSlug);
  const dest = next || redirectHome(user);
  if (input.form) {
    return NextResponse.redirect(new URL(dest, publicOrigin(req)), 303);
  }
  return NextResponse.json({ ok: true, redirect: dest });
}
