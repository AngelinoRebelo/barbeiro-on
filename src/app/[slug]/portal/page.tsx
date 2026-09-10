import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Button } from "@/components/ui";
import { shopPath } from "@/lib/paths";

export default async function PortalHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireClient(slug);
  const shop = await prisma.barberProfile.findUnique({ where: { slug } });
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">/{slug}</p>
      <h2 className="mt-2 text-3xl">{shop?.shopName}</h2>
      <p className="mt-3 text-[#8b93a7]">Olá, {user.name}. Você está na unidade em que criou a conta.</p>
      <div className="mt-6">
        <Link href={shopPath(slug)}>
          <Button>Agendar nesta barbearia</Button>
        </Link>
      </div>
    </Card>
  );
}
