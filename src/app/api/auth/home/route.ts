import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { issueSession, redirectHome } from "@/lib/auth";
import { publicOrigin } from "@/lib/utils";

export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", origin));

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { barberProfile: true, shop: true },
  });
  if (!user || user.status === "SUSPENDED") {
    return NextResponse.redirect(new URL("/login", origin));
  }

  await issueSession(user);
  return NextResponse.redirect(new URL(redirectHome(user) || "/login", origin));
}
