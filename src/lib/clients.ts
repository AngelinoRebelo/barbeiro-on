import { prisma } from "./prisma";

export async function removeShopClientAccount(opts: {
  barberId: string;
  userId?: string | null;
  email?: string | null;
}) {
  const emails = new Set<string>();
  const userIds = new Set<string>();
  if (opts.userId) userIds.add(opts.userId);
  if (opts.email?.trim()) emails.add(opts.email.trim().toLowerCase());

  if (emails.size) {
    const byEmail = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        shopId: opts.barberId,
        email: { in: [...emails] },
      },
      select: { id: true },
    });
    for (const row of byEmail) userIds.add(row.id);
  }

  for (const userId of userIds) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "CLIENT") continue;
    if (user.shopId && user.shopId !== opts.barberId) continue;
    await prisma.user.delete({ where: { id: userId } });
  }
}
