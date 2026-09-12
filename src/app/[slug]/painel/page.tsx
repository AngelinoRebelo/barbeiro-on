import Link from "next/link";
import { requireBarber } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { brl, formatWhen, startOfDaySP, statusLabel, ymd } from "@/lib/utils";
import { qrDataUrl } from "@/lib/qr";
import { shopPath, shopUrl } from "@/lib/paths";
import { queueForAppointment } from "@/lib/queue";

export default async function PainelHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile, features } = await requireBarber(slug);
  const url = shopUrl(profile.slug);
  const qr = await qrDataUrl(url);
  const day = ymd(new Date());
  const [clients, appointments, paid, today] = await Promise.all([
    prisma.barberClient.count({ where: { barberId: profile.id } }),
    prisma.appointment.count({ where: { barberId: profile.id, status: { in: ["SCHEDULED", "CONFIRMED"] } } }),
    prisma.payment.aggregate({
      where: { barberId: profile.id, status: "PAID", kind: "SERVICE" },
      _sum: { amountCents: true },
    }),
    prisma.appointment.findMany({
      where: {
        barberId: profile.id,
        startsAt: { gte: startOfDaySP(day), lt: new Date(`${day}T23:59:59.999-03:00`) },
      },
      include: { client: true, service: true },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
      take: 40,
    }),
  ]);
  const queued = await Promise.all(
    today.map(async (a) => ({
      ...a,
      queue: await queueForAppointment(profile.id, a),
    })),
  );
  queued.sort((a, b) => {
    const aDone = a.status === "DONE" || a.status === "CANCELLED" || a.status === "NO_SHOW";
    const bDone = b.status === "DONE" || b.status === "CANCELLED" || b.status === "NO_SHOW";
    if (aDone !== bDone) return aDone ? 1 : -1;
    if (a.queue.waiting && b.queue.waiting) return a.queue.position - b.queue.position;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });
  const waiting = queued.filter((a) => a.queue.waiting);
  const rest = queued.filter((a) => !a.queue.waiting).slice(0, 4);
  const shown = [...waiting, ...rest];

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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2>Próximos horários</h2>
          <Link href={shopPath(slug, "/painel/agenda")} className="text-sm text-cyan">
            Abrir fila
          </Link>
        </div>
        <div className="grid gap-2">
          {shown.length === 0 && <p className="text-[#8b93a7]">Ninguém na fila hoje.</p>}
          {shown.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/30 text-sm text-gold">
                  {a.queue.waiting ? a.queue.position : "—"}
                </span>
                <div>
                  <p>{a.client.name} · {a.service.name}</p>
                  <p className="text-sm text-[#8b93a7]">{formatWhen(a.startsAt)}</p>
                </div>
              </div>
              <Badge tone={a.status === "DONE" ? "cyan" : a.status === "CANCELLED" ? "muted" : "gold"}>
                {statusLabel(a.status)}
              </Badge>
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
