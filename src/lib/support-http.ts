import { apiUser } from "./auth";
import type { SupportActor } from "./support";

export async function requestActor(req: Request, incoming?: { name?: string; email?: string; guestKey?: string }): Promise<SupportActor | null> {
  const ctx = await apiUser();
  const headerKey = req.headers.get("x-support-key") || "";
  const url = new URL(req.url);
  const guestKey = String(incoming?.guestKey || url.searchParams.get("key") || headerKey || "").trim();
  if (ctx) {
    return {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
      slug: ctx.session.slug,
      guestKey,
    };
  }
  const email = String(incoming?.email || "").trim().toLowerCase();
  const name = String(incoming?.name || "").trim();
  if (!email && !guestKey) return null;
  return {
    name,
    email,
    role: "VISITOR",
    guestKey,
  };
}
