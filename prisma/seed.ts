import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_FEATURES } from "../src/lib/features";

const prisma = new PrismaClient();

const PLANS = [
  {
    slug: "essencial",
    name: "Essencial",
    description: "Agenda, clientes e PIX para começar a unidade.",
    priceCents: 4900,
    sortOrder: 1,
    features: { ...DEFAULT_FEATURES, mercadopago: false },
  },
  {
    slug: "profissional",
    name: "Profissional",
    description: "PIX + Mercado Pago, vitrine pública e operação completa.",
    priceCents: 9900,
    sortOrder: 2,
    features: DEFAULT_FEATURES,
  },
  {
    slug: "studio",
    name: "Studio",
    description: "Tudo do Profissional, pensado para unidades de alto volume.",
    priceCents: 14900,
    sortOrder: 3,
    features: DEFAULT_FEATURES,
  },
];

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

  await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
  });

  for (const plan of PLANS) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        priceCents: plan.priceCents,
        sortOrder: plan.sortOrder,
        features: plan.features,
        active: true,
      },
      create: plan,
    });
  }

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
