"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { brl, formatWhen, METHOD_LABEL, MONTH_LABELS, STATUS_LABEL, yearMonthSP } from "@/lib/utils";

type Move = {
  id: string;
  amountCents: number;
  method: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
  mpPaymentId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  appointmentAt: string | null;
  appointmentStatus: string | null;
};

type Group = { key: string; title: string; hint: string; items: Move[] };

type Payload = {
  shopName: string;
  slug: string;
  year: number;
  month: number;
  summary: {
    receivedCents: number;
    pendingCents: number;
    failedCents: number;
    cancelledCents: number;
    refundedCents: number;
    receivedCount: number;
    pendingCount: number;
    failedCount: number;
    cancelledCount: number;
    refundedCount: number;
    operations: number;
  };
  groups: Group[];
};

function esc(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch));
}

function methodLabel(method: string) {
  return METHOD_LABEL[method] || method;
}

function statusTone(status: string): "cyan" | "danger" | "muted" | "gold" {
  if (status === "PAID") return "cyan";
  if (status === "FAILED" || status === "CANCELLED") return "danger";
  if (status === "PENDING") return "gold";
  return "muted";
}

export function BarberFinance() {
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
    const res = await fetch(`/api/barber/finance?year=${y}&month=${m}`);
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

  function report() {
    if (!data) return;
    const s = data.summary;
    const rows = data.groups
      .filter((g) => g.items.length)
      .map((g) => {
        const body = g.items
          .map((p) => {
            const when = p.paidAt ? `Pago em ${formatWhen(new Date(p.paidAt))}` : `Criado em ${formatWhen(new Date(p.createdAt))}`;
            const slot = p.appointmentAt ? formatWhen(new Date(p.appointmentAt)) : "—";
            return `<tr>
              <td>${esc(g.title)}</td>
              <td>${esc(p.clientName)}<br><small>${esc(p.clientPhone || p.clientEmail || "")}</small></td>
              <td>${esc(p.serviceName)}<br><small>Horário: ${esc(slot)}</small></td>
              <td>${esc(methodLabel(p.method))}${p.mpPaymentId ? `<br><small>MP ${esc(p.mpPaymentId)}</small>` : ""}</td>
              <td>${esc(brl(p.amountCents))}</td>
              <td>${esc(STATUS_LABEL[p.status] || p.status)}<br><small>${esc(when)}</small></td>
            </tr>`;
          })
          .join("");
        return `<h2>${esc(g.title)} (${g.items.length})</h2><table>
          <thead><tr><th>Tipo</th><th>Cliente</th><th>Serviço</th><th>Forma</th><th>Valor</th><th>Situação</th></tr></thead>
          <tbody>${body}</tbody>
        </table>`;
      })
      .join("");

    const csvHeader = "Tipo;Cliente;Telefone;E-mail;Serviço;Horário do atendimento;Forma;Valor;Situação;Criado em;Pago em;ID Mercado Pago";
    const csvRows = data.groups.flatMap((g) =>
      g.items.map((p) =>
        [
          g.title,
          p.clientName,
          p.clientPhone,
          p.clientEmail,
          p.serviceName,
          p.appointmentAt ? formatWhen(new Date(p.appointmentAt)) : "",
          methodLabel(p.method),
          brl(p.amountCents),
          STATUS_LABEL[p.status] || p.status,
          formatWhen(new Date(p.createdAt)),
          p.paidAt ? formatWhen(new Date(p.paidAt)) : "",
          p.mpPaymentId || "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(";"),
      ),
    );
    const csv = "\uFEFF" + [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const file = `relatorio-${data.slug}-${data.year}-${String(data.month).padStart(2, "0")}.csv`;
    const csvUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = csvUrl;
    a.download = file;
    a.click();
    setTimeout(() => URL.revokeObjectURL(csvUrl), 2000);

    const html = `<!doctype html>
      <html lang="pt-BR"><head><meta charset="utf-8">
      <title>Relatório ${esc(periodLabel(data.year, data.month))}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
        h1 { margin: 0 0 4px; font-size: 22px; }
        p, small { color: #444; }
        .cards { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0 24px; }
        .card { border: 1px solid #ddd; padding: 12px 16px; min-width: 140px; }
        .card b { display: block; font-size: 18px; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #f4f4f4; }
        h2 { font-size: 16px; margin: 24px 0 8px; }
        @media print { button { display: none; } }
      </style></head>
      <body>
        <button onclick="window.print()">Imprimir / salvar PDF</button>
        <h1>${esc(data.shopName)}</h1>
        <p>Relatório financeiro · ${esc(periodLabel(data.year, data.month))}</p>
        <div class="cards">
          <div class="card">Recebido<b>${esc(brl(s.receivedCents))}</b><small>${s.receivedCount} pagos</small></div>
          <div class="card">Aguardando<b>${esc(brl(s.pendingCents))}</b><small>${s.pendingCount} em aberto</small></div>
          <div class="card">Não concluídos<b>${esc(brl(s.failedCents + s.cancelledCents))}</b><small>${s.failedCount + s.cancelledCount} operações</small></div>
        </div>
        ${rows || "<p>Nenhuma movimentação neste período.</p>"}
      </body></html>`;
    const win = window.open("", "_blank", "width=980,height=720");
    if (!win) return;
    win.document.write(html);
    win.document.close();
  }

  const s = data?.summary;

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Caixa da unidade</p>
            <h2 className="mt-1 text-2xl">{data ? periodLabel(data.year, data.month) : "Financeiro"}</h2>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Mês">
              <select
                className={inputClass() + " min-w-40"}
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
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
            <Button type="button" onClick={report} disabled={!data}>
              Gerar relatório
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
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Aguardando</p>
            <p className="mt-2 text-3xl">{brl(s.pendingCents)}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">{s.pendingCount} cobranças em aberto</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-[#ff5d73]">Não entrou</p>
            <p className="mt-2 text-3xl">{brl(s.failedCents + s.cancelledCents)}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">
              {s.failedCount} falhas · {s.cancelledCount} cancelados
            </p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Operações</p>
            <p className="mt-2 text-3xl">{s.operations}</p>
            <p className="mt-1 text-sm text-[#8b93a7]">Movimentações do período</p>
          </Card>
        </div>
      )}

      {data?.groups
        .filter((group) => group.items.length > 0 || group.key === "paid" || group.key === "pending")
        .map((group) => (
        <Card key={group.key}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2>{group.title}</h2>
              <p className="mt-1 text-sm text-[#8b93a7]">{group.hint}</p>
            </div>
            <Badge tone={group.key === "paid" ? "cyan" : group.key === "pending" ? "gold" : group.key === "failed" || group.key === "cancelled" ? "danger" : "muted"}>
              {group.items.length}
            </Badge>
          </div>
          <div className="grid gap-2">
            {group.items.length === 0 && <p className="text-[#8b93a7]">Nenhuma operação nesta categoria.</p>}
            {group.items.map((p) => (
              <article key={p.id} className="rounded-2xl border border-white/5 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg">{p.clientName}</p>
                    <p className="text-sm text-[#8b93a7]">
                      {p.serviceName} · {brl(p.amountCents)}
                    </p>
                  </div>
                  <Badge tone={statusTone(p.status)}>{STATUS_LABEL[p.status] || p.status}</Badge>
                </div>
                <dl className="mt-3 grid gap-1 text-sm text-[#8b93a7] sm:grid-cols-2">
                  <div>
                    <span className="text-white/70">Forma: </span>
                    {methodLabel(p.method)}
                  </div>
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
                  {(p.clientPhone || p.clientEmail) && (
                    <div>
                      <span className="text-white/70">Contato: </span>
                      {[p.clientPhone, p.clientEmail].filter(Boolean).join(" · ")}
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
