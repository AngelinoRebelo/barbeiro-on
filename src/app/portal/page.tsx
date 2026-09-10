import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFeatures } from "@/lib/features";
import { Card } from "@/components/ui";
import { brl } from "@/lib/utils";

export default async function PortalHome() {
  await requireClient();
  const shops = await prisma.barberProfile.findMany({
    where: { approved: true, user: { status: "ACTIVE" } },
    include: { services: { where: { active: true }, orderBy: { priceCents: "asc" }, take: 1 } },
    orderBy: { shopName: "asc" },
  });
  const visible = shops.filter((s) => parseFeatures(s.features).publicShop);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {visible.length === 0 && (
        <Card>
          <p className="text-[#8b93a7]">Nenhuma unidade pública no momento. O admin precisa aprovar um barbeiro.</p>
        </Card>
      )}
      {visible.map((s) => (
        <Link key={s.id} href={`/s/${s.slug}`}>
          <Card className="h-full hover:border-gold/40">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">{s.city}</p>
            <h2 className="mt-2 text-2xl">{s.shopName}</h2>
            <p className="mt-2 text-sm text-[#8b93a7]">{s.bio || "Corte, barba e presença."}</p>
            {s.services[0] && <p className="mt-4 text-cyan">a partir de {brl(s.services[0].priceCents)}</p>}
          </Card>
        </Link>
      ))}
    </div>
  );
}
