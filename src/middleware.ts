import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, readSessionToken } from "@/lib/session";

const PUBLIC = [
  "/",
  "/login",
  "/cadastro",
  "/verificar",
  "/recuperar",
  "/redefinir",
  "/s",
  "/pagar",
];

function isPublic(pathname: string) {
  if (PUBLIC.some((p) => pathname === p || (p !== "/" && pathname.startsWith(`${p}/`)))) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/payments/webhook")) return true;
  if (pathname.startsWith("/api/health")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role !== "ADMIN") return NextResponse.redirect(new URL("/painel", req.url));
  }

  if (pathname.startsWith("/painel")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    if (session.role !== "BARBER") return NextResponse.redirect(new URL("/portal", req.url));
  }

  if (pathname.startsWith("/portal")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
    if (session.role === "ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
    if (session.role === "BARBER") return NextResponse.redirect(new URL("/painel", req.url));
  }

  if ((pathname === "/login" || pathname === "/cadastro") && session) {
    const dest = session.role === "ADMIN" ? "/admin" : session.role === "BARBER" ? "/painel" : "/portal";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (!isPublic(pathname) && !session && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
