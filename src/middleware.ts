import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";
import { homePath, isReservedSlug } from "@/lib/paths";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;
  const slug = session?.slug;

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "ADMIN") return NextResponse.redirect(new URL(homePath(session.role, slug), req.url));
  }

  if (pathname === "/painel" || pathname.startsWith("/painel/")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(new URL(homePath(session.role, slug), req.url));
  }

  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(new URL(homePath(session.role, slug), req.url));
  }

  const parts = pathname.split("/").filter(Boolean);
  const maybeSlug = parts[0] || "";
  const nested = parts[1];

  if (maybeSlug && !isReservedSlug(maybeSlug) && nested === "painel") {
    if (!session) return NextResponse.redirect(new URL(`/${maybeSlug}/login`, req.url));
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    if (session.role !== "BARBER" || session.slug !== maybeSlug) {
      return NextResponse.redirect(new URL(homePath(session.role, slug), req.url));
    }
  }

  if (maybeSlug && !isReservedSlug(maybeSlug) && nested === "portal") {
    if (!session) return NextResponse.redirect(new URL(`/${maybeSlug}/login`, req.url));
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    if (session.role !== "CLIENT" || session.slug !== maybeSlug) {
      return NextResponse.redirect(new URL(homePath(session.role, slug), req.url));
    }
  }

  if ((pathname === "/login" || pathname === "/cadastro") && session) {
    return NextResponse.redirect(new URL(homePath(session.role, slug), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
