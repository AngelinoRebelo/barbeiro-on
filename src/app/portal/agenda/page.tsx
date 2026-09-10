import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, Button } from "@/components/ui";
import { brl, formatWhen } from "@/lib/utils";

export default async function PortalAgenda() {
  const { user } = await requireClient();
  const appointments = await prisma.appointment.findMany({
    where: { userId: user.id },
    include: { service: true, barber: true },
    orderBy: { startsAt: "desc" },
  });

  return (
    <Card>
      <h2 className="mb-4">Seus horários</h2>
      <div className="grid gap-2">
        {appointments.length === 0 && <p className="text-[#8b93a7]">Nenhum agendamento ainda.</p>}
        {appointments.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 px-4 py-3">
            <div>
              <p>{a.barber.shopName} · {a.service.name}</p>
              <p className="text-sm text-[#8b93a7]">{formatWhen(a.startsAt)} · {brl(a.service.priceCents)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{a.status}</Badge>
              <Link href={`/s/${a.barber.slug}`}>
                <Button variant="ghost" type="button">Ver loja</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
