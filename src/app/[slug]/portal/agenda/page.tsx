import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, Button } from "@/components/ui";
import { brl, formatWhen } from "@/lib/utils";
import { shopPath } from "@/lib/paths";

export default async function PortalAgenda({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireClient(slug);
  const shop = await prisma.barberProfile.findUnique({ where: { slug } });
  const appointments = await prisma.appointment.findMany({
    where: { userId: user.id, barberId: shop?.id },
    include: { service: true, barber: true },
    orderBy: { startsAt: "desc" },
  });

  return (
    <Card>
      <h2 className="mb-4">Seus horários em {shop?.shopName}</h2>
      <div className="grid gap-2">
        {appointments.length === 0 && <p className="text-[#8b93a7]">Nenhum agendamento ainda.</p>}
        {appointments.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 px-4 py-3">
            <div>
              <p>{a.service.name}</p>
              <p className="text-sm text-[#8b93a7]">{formatWhen(a.startsAt)} · {brl(a.service.priceCents)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{a.status}</Badge>
              <Link href={shopPath(a.barber.slug)}>
                <Button variant="ghost" type="button">Agendar de novo</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
