import Link from "next/link";
import { requireBarber } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { brl, formatWhen, appUrl } from "@/lib/utils";
import { qrDataUrl } from "@/lib/qr";

export default async function PainelHome() {
  const { profile, features } = await requireBarber();
  const shopUrl = `${appUrl()}/s/${profile.slug}`;
  const qr = await qrDataUrl(shopUrl);
  const [clients, appointments, paid] = await Promise.all([
    prisma.barberClient.count({ where: { barberId: profile.id } }),
    prisma.appointment.count({ where: { barberId: profile.id, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
    prisma.payment.aggregate({ where: { barberId: profile.id, status: "PAID" }, _sum: { amountCents: true } }),
  ]);
  const today = await prisma.appointment.findMany({
    where: {
      barberId: profile.id,
      startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
    include: { client: true, service: true },
    orderBy: { startsAt: "asc" },
    take: 8,
  });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Clientes</p>
        <p className="mt-2 text-4xl">{clients}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Agenda aberta</p>
        <p className="mt-2 text-4xl">{appointments}</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Recebido</p>
        <p className="mt-2 text-4xl">{brl(paid._sum.amountCents || 0)}</p>
      </Card>
      <Card className="lg:col-span-2">
        <h2 className="mb-4">Próximos horários</h2>
        <div className="grid gap-2">
          {today.length === 0 && <p className="text-[#8b93a7]">Nenhum horário à frente.</p>}
          {today.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3">
              <div>
                <p>{a.client.name} · {a.service.name}</p>
                <p className="text-sm text-[#8b93a7]">{formatWhen(a.startsAt)}</p>
              </div>
              <Badge>{a.status}</Badge>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2>Entrada da unidade</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">QR e código para a página pública. Sem FileLink: o cliente entra por este link.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR da barbearia" className="mt-4 w-44 rounded-2xl" />
        <p className="mt-3 font-mono text-xs break-all text-gold">{shopUrl}</p>
        {features.publicShop ? (
          <Link className="mt-4 inline-block text-sm text-cyan" href={`/s/${profile.slug}`}>Abrir vitrine</Link>
        ) : (
          <p className="mt-4 text-sm text-[#ff5d73]">Vitrine desligada pelo admin.</p>
        )}
      </Card>
    </div>
  );
}
