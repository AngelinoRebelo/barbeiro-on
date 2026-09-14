import { NextResponse } from "next/server";

export function isSafePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
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
