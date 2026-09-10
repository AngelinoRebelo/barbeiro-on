import Link from "next/link";
import { requireBarber } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { brl, formatWhen } from "@/lib/utils";
import { qrDataUrl } from "@/lib/qr";
import { shopPath, shopUrl } from "@/lib/paths";

export default async function PainelHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile, features } = await requireBarber(slug);
  const url = shopUrl(profile.slug);
  const qr = await qrDataUrl(url);
  const [clients, appointments, paid] = await Promise.all([
    prisma.barberClient.count({ where: { barberId: profile.id } }),
    prisma.appointment.count({ where: { barberId: profile.id, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
    prisma.payment.aggregate({
      where: { barberId: profile.id, status: "PAID", kind: "SERVICE" },
      _sum: { amountCents: true },
    }),
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
        <h2>Link da unidade</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">Compartilhe este endereço e o QR. O cliente entra já nesta barbearia e cria a conta aqui.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR da barbearia" className="mt-4 w-44 rounded-2xl" />
        <p className="mt-3 font-mono text-xs break-all text-gold">{url}</p>
        <Link className="mt-4 inline-block text-sm text-cyan" href={shopPath(profile.slug)}>
          Abrir {shopPath(profile.slug)}
        </Link>
        {!features.publicShop && <p className="mt-2 text-sm text-[#ff5d73]">Vitrine desligada pelo plano/admin.</p>}
      </Card>
    </div>
  );
}
