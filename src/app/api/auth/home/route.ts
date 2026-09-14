import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getSession } from "@/lib/session";
import { issueSession, redirectHome } from "@/lib/auth";
import { localRedirect } from "@/lib/http";

export async function GET() {
  const session = await getSession();
  if (!session) {
    await clearSessionCookie();
    return localRedirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { barberProfile: true, shop: true },
  });
  if (!user || user.status === "SUSPENDED") {
    await clearSessionCookie();
    return localRedirect("/login");
  }

  await issueSession(user);
  const dest = redirectHome(user);
  if (!dest || dest === "/login") {
    await clearSessionCookie();
    return localRedirect("/login");
  }
  return localRedirect(dest);
}
