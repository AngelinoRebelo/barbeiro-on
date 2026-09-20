import Link from "next/link";
import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Button, Badge } from "@/components/ui";
import { shopPath } from "@/lib/paths";
import { formatWhen } from "@/lib/utils";
import { queueForAppointment, queueLabel, paidFrom } from "@/lib/queue";

export default async function PortalHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireClient(slug);
  const shop = await prisma.barberProfile.findUnique({ where: { slug } });
  const next = shop
    ? await prisma.appointment.findFirst({
        where: {
          userId: user.id,
          barberId: shop.id,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          startsAt: { gte: new Date() },
        },
        include: { service: true, payments: { select: { status: true } } },
        orderBy: { startsAt: "asc" },
      })
    : null;
  const queue = next && shop ? await queueForAppointment(shop.id, next) : null;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Logado em /{slug}</p>
        <h2 className="mt-2 text-3xl">{shop?.shopName}</h2>
        <p className="mt-3 text-[#8b93a7]">Olá, {user.name}. Esta é a sua área nesta barbearia.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={shopPath(slug, "/portal/agendar")}>
            <Button>Agendar horário</Button>
          </Link>
          <Link href={shopPath(slug, "/portal/agenda")}>
            <Button variant="ghost">Meus horários</Button>
          </Link>
        </div>
      </Card>
      {next && queue && (
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan">Próximo horário</p>
          <h3 className="mt-2 text-2xl">{queueLabel(queue)}</h3>
          <p className="mt-2 text-[#8b93a7]">
            {next.service.name} · {formatWhen(next.startsAt)}
          </p>
          <div className="mt-3 flex gap-2">
            <Badge>{queue.position}º na fila</Badge>
            <Badge tone={paidFrom(next.payments) === "PAID" ? "cyan" : "danger"}>
              {paidFrom(next.payments) === "PAID" ? "Pago" : "A pagar"}
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
