import { prisma } from "./prisma";

export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });
}
