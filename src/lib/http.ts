import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function isSafePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

function splitPath(path: string) {
  const location = isSafePath(path) ? path : "/";
  const queryAt = location.indexOf("?");
  return {
    pathname: queryAt === -1 ? location : location.slice(0, queryAt),
    search: queryAt === -1 ? "" : location.slice(queryAt),
  };
}

export function localRedirect(path: string, status = 307) {
  const location = isSafePath(path) ? path : "/";
  return new NextResponse(null, {
    status,
    headers: {
      Location: location,
      "Cache-Control": "private, no-store",
    },
  });
}

export function middlewareRedirect(req: NextRequest, path: string, status = 307) {
  const { pathname, search } = splitPath(path);
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  return NextResponse.redirect(url, status);
}
