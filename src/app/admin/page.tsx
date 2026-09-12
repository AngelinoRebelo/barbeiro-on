import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card, Badge } from "@/components/ui";
import { brl, statusLabel } from "@/lib/utils";
import Link from "next/link";

export default async function AdminHome() {
  await requireAdmin();
  const [users, barbers, pending, appointments, paid] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "BARBER" } }),
    prisma.barberProfile.count({ where: { approved: false } }),
    prisma.appointment.count(),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true }, _count: true }),
  ]);
  const recent = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { barberProfile: true },
  });

  const stats = [
    ["Contas", String(users)],
    ["Barbeiros", String(barbers)],
    ["Aguardando aprovação", String(pending)],
    ["Agendamentos", String(appointments)],
    ["Pagamentos", String(paid._count)],
    ["Volume pago", brl(paid._sum.amountCents || 0)],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map(([k, v]) => (
        <Card key={k}>
          <p className="text-xs uppercase tracking-[0.22em] text-[#8b93a7]">{k}</p>
          <p className="mt-2 text-3xl font-semibold">{v}</p>
        </Card>
      ))}
      <Card className="md:col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <h2>Últimas contas</h2>
          <Link className="text-sm text-gold" href="/admin/usuarios">Gerenciar</Link>
        </div>
        <div className="grid gap-2">
          {recent.map((u) => (
            <Link key={u.id} href={`/admin/usuarios/${u.id}`} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3 hover:border-gold/30">
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-[#8b93a7]">{u.email}{u.barberProfile ? ` · ${u.barberProfile.shopName}` : ""}</p>
              </div>
              <Badge tone={u.status === "ACTIVE" ? "cyan" : u.status === "SUSPENDED" ? "danger" : "muted"}>
                {statusLabel(u.role)} · {statusLabel(u.status)}
              </Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
