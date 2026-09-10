import { requireBarber } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge } from "@/components/ui";
import { brl, formatWhen } from "@/lib/utils";
import Link from "next/link";

export default async function FinanceiroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { profile } = await requireBarber(slug);
  const payments = await prisma.payment.findMany({
    where: { barberId: profile.id },
    include: { client: true, appointment: { include: { service: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const paid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amountCents, 0);

  return (
    <div className="grid gap-4">
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Liquidado</p>
        <p className="mt-2 text-4xl">{brl(paid)}</p>
      </Card>
      <Card>
        <h2 className="mb-4">Movimento</h2>
        <div className="grid gap-2">
          {payments.map((p) => (
            <Link key={p.id} href={`/${profile.slug}/pagar/${p.id}`} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3">
              <div>
                <p>{p.client?.name || "Cliente"} · {p.method}</p>
                <p className="text-sm text-[#8b93a7]">{formatWhen(p.createdAt)} · {brl(p.amountCents)}</p>
              </div>
              <Badge tone={p.status === "PAID" ? "cyan" : p.status === "FAILED" ? "danger" : "muted"}>{p.status}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
