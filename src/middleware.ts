import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken, type SessionUser } from "@/lib/session";
import { homePath, isReservedSlug } from "@/lib/paths";

function dropSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

function sendTo(req: NextRequest, dest: string | null, fallback: string) {
  const target = dest || fallback;
  if (target === req.nextUrl.pathname) return null;
  return NextResponse.redirect(new URL(target, req.url));
}

function homeOf(session: SessionUser) {
  return homePath(session.role, session.slug);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "ADMIN") {
      return sendTo(req, homeOf(session), "/login") ?? dropSession(NextResponse.redirect(new URL("/login", req.url)));
    }
  }

  if (pathname === "/painel" || pathname.startsWith("/painel/") || pathname === "/portal" || pathname.startsWith("/portal/")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    const dest = homeOf(session);
    return sendTo(req, dest, "/login") ?? dropSession(NextResponse.redirect(new URL("/login", req.url)));
  }

  const parts = pathname.split("/").filter(Boolean);
  const maybeSlug = parts[0] || "";
  const nested = parts[1];

  if (maybeSlug && !isReservedSlug(maybeSlug) && nested === "painel") {
    if (!session) return NextResponse.redirect(new URL(`/${maybeSlug}/login`, req.url));
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    if (session.role !== "BARBER" || session.slug !== maybeSlug) {
      return sendTo(req, homeOf(session), `/${maybeSlug}/login`) ?? NextResponse.redirect(new URL(`/${maybeSlug}/login`, req.url));
    }
  }

  if (maybeSlug && !isReservedSlug(maybeSlug) && nested === "portal") {
    if (!session) return NextResponse.redirect(new URL(`/${maybeSlug}/login`, req.url));
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    if (session.role !== "CLIENT" || session.slug !== maybeSlug) {
      return sendTo(req, homeOf(session), `/${maybeSlug}/login`) ?? NextResponse.redirect(new URL(`/${maybeSlug}/login`, req.url));
    }
  }

  if (pathname === "/login" || pathname === "/cadastro") {
    if (session) {
      const dest = homeOf(session);
      const redirected = sendTo(req, dest, pathname);
      if (redirected) return redirected;
      return dropSession(NextResponse.next());
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
