import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card } from "@/components/ui";
import { brl } from "@/lib/utils";
import Link from "next/link";
import { AdminRecentAccounts } from "@/components/admin-recent-accounts";

export default async function AdminHome() {
  const { user: me } = await requireAdmin();
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
    include: { barberProfile: true, shop: true },
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
        <AdminRecentAccounts
          me={me.id}
          users={recent.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            shopName: u.barberProfile?.shopName || u.shop?.shopName || null,
          }))}
        />
      </Card>
    </div>
  );
}
