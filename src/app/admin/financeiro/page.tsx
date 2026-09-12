"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { brl, formatDay, formatWhen, METHOD_LABEL, MONTH_LABELS, STATUS_LABEL, yearMonthSP } from "@/lib/utils";

type Move = {
  id: string;
  amountCents: number;
  method: string;
  kind: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  mpPaymentId: string | null;
  shopName: string;
  slug: string;
  payerName: string;
  payerEmail: string;
  payerRole: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  appointmentAt: string | null;
  appointmentStatus: string | null;
};

type UserBlock = {
  ownerId: string;
  name: string;
  email: string;
  shopName: string;
  slug: string;
  accessUntil: string | null;
  paidCents: number;
  paidCount: number;
  pendingCents: number;
  pendingCount: number;
  lastPaidAt: string | null;
  lastPaidCents: number | null;
  lastPaidKind: string | null;
  payments: Move[];
};

type Payload = {
  year: number;
  month: number;
  summary: {
    receivedCents: number;
    receivedCount: number;
    planCents: number;
    planCount: number;
    serviceCents: number;
    serviceCount: number;
    pendingCents: number;
    pendingCount: number;
    failedCount: number;
    cancelledCount: number;
    operations: number;
    users: number;
  };
  users: UserBlock[];
};

function kindLabel(kind: string) {
  return kind === "SUBSCRIPTION" ? "Plano da plataforma" : "Serviço da unidade";
}

function statusTone(status: string): "cyan" | "danger" | "muted" | "gold" {
  if (status === "PAID") return "cyan";
  if (status === "FAILED" || status === "CANCELLED") return "danger";
  if (status === "PENDING") return "gold";
  return "muted";
}

export default function AdminFinanceiroPage() {
  const now = yearMonthSP();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [data, setData] = useState<Payload | null>(null);
  const [msg, setMsg] = useState("");

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = now.year; y >= now.year - 5; y -= 1) list.push(y);
    return list;
  }, [now.year]);

  async function load(y = year, m = month) {
    setMsg("");
    const res = await fetch(`/api/admin/finance?year=${y}&month=${m}`);
    const json = await res.json();
    if (!res.ok) return setMsg(json.error || "Não foi possível carregar o financeiro.");
    setData(json);
  }

  useEffect(() => {
    load(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function periodLabel(y: number, m: number) {
    return `${MONTH_LABELS[m - 1]} de ${y}`;
  }

  const s = data?.summary;

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Caixa da plataforma</p>
            <h2 className="mt-1 text-2xl">{data ? periodLabel(data.year, data.month) : "Financeiro"}</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#8b93a7]">
              Pagamentos de cada unidade no mês: mensalidade da plataforma e serviços cobrados aos clientes.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Mês">
              <select className={inputClass() + " min-w-40"} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTH_LABELS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Ano">
              <select className={inputClass() + " min-w-28"} value={year} onChange={(e) => setYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Button type="button" variant="ghost" onClick={() => load(year, month)}>
              Atualizar
            </Button>
          </div>
        </div>
        {msg && <p className="mt-3 text-sm text-[#ff5d73]">{msg}</p>}
      </Card>

      {s && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan">Recebido</p>
            <p className="mt-2 text-3xl">{brl(s.receivedCents)}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">{s.receivedCount} pagamentos confirmados</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Mensalidades</p>
            <p className="mt-2 text-3xl">{brl(s.planCents)}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">{s.planCount} planos pagos</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Serviços</p>
            <p className="mt-2 text-3xl">{brl(s.serviceCents)}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">{s.serviceCount} serviços pagos</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Unidades</p>
            <p className="mt-2 text-3xl">{s.users}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">
              {s.pendingCount} em aberto · {s.operations} operações
            </p>
          </Card>
        </div>
      )}

      {data && data.users.length === 0 && (
        <Card>
          <p className="text-[#8b93a7]">Nenhum pagamento neste período.</p>
        </Card>
      )}

      {data?.users.map((user) => (
        <Card key={user.ownerId}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link href={`/admin/usuarios/${user.ownerId}`} className="text-xl font-semibold hover:text-gold">
                {user.name}
              </Link>
              <p className="mt-1 text-sm text-[#8b93a7]">
                {user.email} · {user.shopName} · /{user.slug}
              </p>
              <p className="mt-1 text-sm text-[#8b93a7]">
                Vigência: {user.accessUntil ? formatDay(new Date(user.accessUntil)) : "sem acesso"}
                {user.lastPaidAt
                  ? ` · último pagamento ${brl(user.lastPaidCents || 0)} em ${formatWhen(new Date(user.lastPaidAt))}${user.lastPaidKind === "SUBSCRIPTION" ? " (plano)" : " (serviço)"}`
                  : " · sem pagamento confirmado neste recorte"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="cyan">{brl(user.paidCents)} pago</Badge>
              {user.pendingCount > 0 && <Badge tone="gold">{user.pendingCount} em aberto</Badge>}
            </div>
          </div>
          <div className="grid gap-2">
            {user.payments.map((p) => (
              <article key={p.id} className="rounded-2xl border border-white/5 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{p.serviceName}</p>
                    <p className="text-sm text-[#8b93a7]">
                      {kindLabel(p.kind)} · {brl(p.amountCents)} · {METHOD_LABEL[p.method] || p.method}
                    </p>
                  </div>
                  <Badge tone={statusTone(p.status)}>{STATUS_LABEL[p.status] || p.status}</Badge>
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-[#8b93a7] sm:grid-cols-2">
                  <div>
                    <span className="text-white/70">Pagador: </span>
                    {p.payerName} · {p.payerEmail}
                    {p.payerRole ? ` · ${STATUS_LABEL[p.payerRole] || p.payerRole}` : ""}
                  </div>
                  {(p.clientName || p.clientPhone || p.clientEmail) && p.kind === "SERVICE" && (
                    <div>
                      <span className="text-white/70">Cliente: </span>
                      {[p.clientName, p.clientPhone, p.clientEmail].filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {p.appointmentAt && (
                    <div>
                      <span className="text-white/70">Atendimento: </span>
                      {formatWhen(new Date(p.appointmentAt))}
                      {p.appointmentStatus ? ` · ${STATUS_LABEL[p.appointmentStatus] || p.appointmentStatus}` : ""}
                    </div>
                  )}
                  <div>
                    <span className="text-white/70">Cobrança criada: </span>
                    {formatWhen(new Date(p.createdAt))}
                  </div>
                  {p.paidAt && (
                    <div>
                      <span className="text-white/70">Pago em: </span>
                      {formatWhen(new Date(p.paidAt))}
                    </div>
                  )}
                  {p.mpPaymentId && (
                    <div className="sm:col-span-2">
                      <span className="text-white/70">ID Mercado Pago: </span>
                      <span className="font-mono text-xs">{p.mpPaymentId}</span>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
