import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "machaddoo@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Pr@782031";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Machaddoo",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
    create: {
      email,
      name: "Machaddoo",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
      passwordHash,
    },
  });

  console.log(`Admin pronto: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
