import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken, sessionCookieOptions, type SessionUser } from "@/lib/session";
import { localRedirect } from "@/lib/http";
import { homePath, isReservedSlug } from "@/lib/paths";

function dropSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return res;
}

function sendTo(req: NextRequest, dest: string | null, fallback: string) {
  const target = dest || fallback;
  if (target === req.nextUrl.pathname) return null;
  return localRedirect(target);
}

function homeOf(session: SessionUser) {
  return homePath(session.role, session.slug);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (pathname.startsWith("/admin")) {
    if (!session) return localRedirect("/login");
    if (session.role !== "ADMIN") {
      return sendTo(req, homeOf(session), "/login") ?? dropSession(localRedirect("/login"));
    }
  }

  if (pathname === "/painel" || pathname.startsWith("/painel/") || pathname === "/portal" || pathname.startsWith("/portal/")) {
    if (!session) return localRedirect("/login");
    const home = homeOf(session);
    if (home) return localRedirect(home);
    return dropSession(localRedirect("/login"));
  }

  const parts = pathname.split("/").filter(Boolean);
  const maybeSlug = parts[0] || "";
  const nested = parts[1];

  if (maybeSlug && !isReservedSlug(maybeSlug) && nested === "painel") {
    if (!session) return localRedirect(`/${maybeSlug}/login`);
    if (session.role === "ADMIN") return localRedirect("/admin");
    if (session.role !== "BARBER") {
      return sendTo(req, homeOf(session), `/${maybeSlug}/login`) ?? localRedirect(`/${maybeSlug}/login`);
    }
  }

  if (maybeSlug && !isReservedSlug(maybeSlug) && nested === "portal") {
    if (!session) return localRedirect(`/${maybeSlug}/login`);
    if (session.role === "ADMIN") return localRedirect("/admin");
    if (session.role !== "CLIENT") {
      return sendTo(req, homeOf(session), `/${maybeSlug}/login`) ?? localRedirect(`/${maybeSlug}/login`);
    }
  }

  if (pathname === "/login" || pathname === "/cadastro") {
    if (session) {
      const home = homeOf(session);
      if (home) return localRedirect(home);
      return dropSession(NextResponse.next());
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
