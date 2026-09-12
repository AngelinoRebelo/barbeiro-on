"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { FEATURE_LABELS, type FeatureFlags } from "@/lib/features";
import { brl, formatDay, toCents } from "@/lib/utils";

type Plan = { id: string; name: string; durationDays: number; priceCents: number };
type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
};
type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  shopName: string | null;
  slug: string | null;
  approved: boolean | null;
  features: FeatureFlags | null;
  planId: string | null;
  planName: string | null;
  planPriceCents: number | null;
  billingCents: number | null;
  accessUntil: string | null;
  trialUntil: string | null;
  onTrial: boolean;
  trialDaysLeft: number;
  clients: ClientRow[];
};

function daysLeft(until: string | null) {
  if (!until) return 0;
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 86400000));
}

export default function UsuariosPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [users, setUsers] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [me, setMe] = useState("");
  const [trialDays, setTrialDays] = useState("15");
  const [selectedPlan, setSelectedPlan] = useState<Record<string, string>>({});
  const [extraDays, setExtraDays] = useState<Record<string, string>>({});
  const [trialDraft, setTrialDraft] = useState<Record<string, string>>({});
  const [billingDraft, setBillingDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const [usersRes, plansRes] = await Promise.all([
      fetch(`/api/admin/users?q=${encodeURIComponent(q)}&role=${role}`),
      fetch("/api/admin/plans"),
    ]);
    const usersData = await usersRes.json();
    const plansData = await plansRes.json();
    setMe(usersData.me || "");
    if (typeof usersData.trialDays === "number") setTrialDays(String(usersData.trialDays));
    setUsers(usersData.users || []);
    setPlans((plansData.plans || []).filter((p: Plan & { active?: boolean }) => p.active !== false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, body: object) {
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) {
      alert(data.error || "Não foi possível atualizar.");
      return false;
    }
    await load();
    return true;
  }

  async function remove(id: string) {
    if (!confirm("Excluir este usuário? Esta ação não pode ser desfeita.")) return;
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) {
      alert(data.error || "Não foi possível excluir.");
      return;
    }
    await load();
  }

  async function saveDefaultTrial() {
    setMsg("");
    const res = await fetch("/api/admin/billing", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trialDays: Number(trialDays) }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Novas unidades começam com ${data.trialDays} dias de teste grátis.` : data.error);
    if (res.ok) await load();
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap gap-3">
        <input className={inputClass() + " max-w-sm"} placeholder="Buscar nome, e-mail ou loja" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputClass() + " max-w-40"} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Todos</option>
          <option value="BARBER">Barbeiros</option>
          <option value="CLIENT">Clientes</option>
          <option value="ADMIN">Admins</option>
        </select>
        <Button onClick={load}>Filtrar</Button>
      </Card>
      <Card>
        <h2 className="mb-2 text-xl">Período de teste padrão</h2>
        <p className="mb-4 text-sm text-[#8b93a7]">
          Toda nova conta de barbeiro começa gratuita por estes dias. Depois o admin pode ajustar o prazo em cada unidade.
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void saveDefaultTrial();
          }}
        >
          <Field label="Dias de teste">
            <input className={inputClass() + " w-28"} type="number" min={1} max={3650} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
          </Field>
          <Button>Salvar teste padrão</Button>
        </form>
        {msg && <p className="mt-3 text-sm text-cyan">{msg}</p>}
      </Card>
      <div className="grid gap-3">
        {users.map((u) => {
          const left = daysLeft(u.accessUntil);
          const planValue = selectedPlan[u.id] || u.planId || plans[0]?.id || "";
          const chargeCents = u.billingCents ?? u.planPriceCents ?? 0;
          return (
            <Card key={u.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/usuarios/${u.id}`} className="text-lg font-medium hover:text-gold">
                    {u.name}
                  </Link>
                  <p className="text-sm text-[#8b93a7]">{u.email}{u.shopName ? ` · ${u.shopName}` : ""}{u.slug ? ` · /${u.slug}` : ""}</p>
                  {u.role === "BARBER" && (
                    <p className="mt-1 text-sm text-[#8b93a7]">
                      {u.planName ? `Plano ${u.planName}` : "Sem plano"}
                      {` · cobrança ${brl(chargeCents)}${u.billingCents != null ? " (valor especial)" : ""}`}
                      {u.accessUntil
                        ? ` · vigente até ${formatDay(new Date(u.accessUntil))} (${left} dia${left === 1 ? "" : "s"})`
                        : " · sem vigência"}
                    </p>
                  )}
                  {u.onTrial && (
                    <p className="mt-2 rounded-2xl border border-gold/35 bg-[rgba(212,175,55,0.12)] px-3 py-2 text-sm text-gold">
                      Conta gratuita em período de teste
                      {u.trialDaysLeft === 1 ? " · resta 1 dia" : ` · restam ${u.trialDaysLeft} dias`}
                      {` · padrão da plataforma: ${trialDays} dia${trialDays === "1" ? "" : "s"}`}.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{u.role === "ADMIN" ? "Admin" : u.role === "BARBER" ? "Barbeiro" : "Cliente"}</Badge>
                  <Badge tone={u.status === "ACTIVE" ? "cyan" : u.status === "SUSPENDED" ? "danger" : "muted"}>
                    {u.status === "ACTIVE" ? "Ativo" : u.status === "SUSPENDED" ? "Suspenso" : "Aguardando e-mail"}
                  </Badge>
                  {u.onTrial && <Badge tone="gold">teste grátis</Badge>}
                  {u.approved === false && <Badge tone="danger">aguardando</Badge>}
                  {u.approved === true && <Badge tone="cyan">aprovado</Badge>}
                  {u.slug && (
                    <Link className="text-sm text-gold" href={`/${u.slug}`}>
                      /{u.slug}
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {u.status !== "ACTIVE" && (
                  <Button variant="cyan" disabled={busy === u.id} onClick={() => patch(u.id, { action: "verify", status: "ACTIVE" })}>
                    Ativar
                  </Button>
                )}
                {u.status !== "SUSPENDED" && (
                  <Button variant="danger" disabled={busy === u.id} onClick={() => patch(u.id, { status: "SUSPENDED" })}>
                    Suspender
                  </Button>
                )}
                {u.role === "BARBER" && (
                  <Button variant="ghost" disabled={busy === u.id} onClick={() => patch(u.id, { approved: !u.approved })}>
                    {u.approved ? "Revogar unidade" : "Aprovar unidade"}
                  </Button>
                )}
                <Button variant="ghost" disabled={busy === u.id} onClick={() => patch(u.id, { action: "resend" })}>
                  Reenviar e-mail
                </Button>
                {u.id !== me && u.role !== "ADMIN" && (
                  <Button variant="danger" disabled={busy === u.id} onClick={() => remove(u.id)}>
                    Excluir
                  </Button>
                )}
              </div>
              {u.role === "BARBER" && (
                <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-white/5 p-3">
                  <label className="grid gap-1 text-xs uppercase tracking-[0.18em] text-[#8b93a7]">
                    Dias de teste
                    <input
                      className={inputClass() + " w-24"}
                      type="number"
                      min={0}
                      max={3650}
                      value={trialDraft[u.id] ?? String(u.onTrial ? u.trialDaysLeft : Number(trialDays) || 15)}
                      onChange={(e) => setTrialDraft((s) => ({ ...s, [u.id]: e.target.value }))}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    disabled={busy === u.id}
                    onClick={() =>
                      patch(u.id, {
                        action: "setTrialDays",
                        days: Number(trialDraft[u.id] ?? (u.onTrial ? u.trialDaysLeft : Number(trialDays) || 15)),
                      })
                    }
                  >
                    Salvar teste
                  </Button>
                  <label className="grid gap-1 text-xs uppercase tracking-[0.18em] text-[#8b93a7]">
                    Atribuir plano
                    <select
                      className={inputClass() + " min-w-44"}
                      value={planValue}
                      onChange={(e) => setSelectedPlan((s) => ({ ...s, [u.id]: e.target.value }))}
                    >
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.durationDays} dias
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    variant="ghost"
                    disabled={busy === u.id || !planValue}
                    onClick={() => patch(u.id, { action: "assignPlan", planId: planValue })}
                  >
                    Aplicar plano
                  </Button>
                  <label className="grid gap-1 text-xs uppercase tracking-[0.18em] text-[#8b93a7]">
                    Acrescentar dias
                    <input
                      className={inputClass() + " w-24"}
                      type="number"
                      min={1}
                      max={3650}
                      value={extraDays[u.id] ?? "30"}
                      onChange={(e) => setExtraDays((s) => ({ ...s, [u.id]: e.target.value }))}
                    />
                  </label>
                  <Button
                    variant="cyan"
                    disabled={busy === u.id}
                    onClick={() => patch(u.id, { action: "addDays", days: Number(extraDays[u.id] || 30) })}
                  >
                    Acrescentar
                  </Button>
                  <label className="grid gap-1 text-xs uppercase tracking-[0.18em] text-[#8b93a7]">
                    Valor da cobrança
                    <input
                      className={inputClass() + " w-32"}
                      inputMode="decimal"
                      placeholder="ex: 1,00"
                      value={billingDraft[u.id] ?? ""}
                      onChange={(e) => setBillingDraft((s) => ({ ...s, [u.id]: e.target.value }))}
                    />
                  </label>
                  <Button
                    variant="ghost"
                    disabled={busy === u.id || !(billingDraft[u.id] || "").trim()}
                    onClick={async () => {
                      const raw = (billingDraft[u.id] || "").trim();
                      const parsed = Number(raw.replace(/\./g, "").replace(",", "."));
                      if (!raw || !Number.isFinite(parsed) || parsed < 0) {
                        alert("Informe o valor em reais, por exemplo 1,00.");
                        return;
                      }
                      const ok = await patch(u.id, { action: "setBilling", billingCents: toCents(raw) });
                      if (ok) setBillingDraft((s) => ({ ...s, [u.id]: "" }));
                    }}
                  >
                    Salvar valor
                  </Button>
                  {u.billingCents != null && (
                    <Button
                      variant="ghost"
                      disabled={busy === u.id}
                      onClick={() => patch(u.id, { action: "setBilling", billingCents: null })}
                    >
                      Usar preço do plano
                    </Button>
                  )}
                </div>
              )}
              {u.role === "BARBER" && (
                <div className="rounded-2xl border border-white/5 p-3">
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#8b93a7]">
                    Clientes da unidade · {u.clients.length}
                  </p>
                  {u.clients.length === 0 && (
                    <p className="text-sm text-[#8b93a7]">Nenhum cliente com conta nesta barbearia.</p>
                  )}
                  <div className="grid gap-2">
                    {u.clients.map((c) => (
                      <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-2">
                        <div>
                          <Link href={`/admin/usuarios/${c.id}`} className="font-medium hover:text-gold">
                            {c.name}
                          </Link>
                          <p className="text-sm text-[#8b93a7]">
                            {c.email}
                            {c.phone ? ` · ${c.phone}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>Cliente</Badge>
                          <Badge tone={c.status === "ACTIVE" ? "cyan" : c.status === "SUSPENDED" ? "danger" : "muted"}>
                            {c.status === "ACTIVE" ? "Ativo" : c.status === "SUSPENDED" ? "Suspenso" : "Aguardando e-mail"}
                          </Badge>
                          {c.status !== "ACTIVE" && (
                            <Button variant="cyan" disabled={busy === c.id} onClick={() => patch(c.id, { action: "verify", status: "ACTIVE" })}>
                              Ativar
                            </Button>
                          )}
                          {c.status !== "SUSPENDED" && (
                            <Button variant="danger" disabled={busy === c.id} onClick={() => patch(c.id, { status: "SUSPENDED" })}>
                              Suspender
                            </Button>
                          )}
                          <Button variant="ghost" disabled={busy === c.id} onClick={() => patch(c.id, { action: "resend" })}>
                            Reenviar e-mail
                          </Button>
                          <Button variant="danger" disabled={busy === c.id} onClick={() => remove(c.id)}>
                            Excluir
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {u.features && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {(Object.keys(FEATURE_LABELS) as (keyof FeatureFlags)[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => patch(u.id, { features: { [key]: !u.features?.[key] } })}
                      className={`rounded-full border px-3 py-1 text-xs ${u.features?.[key] ? "border-cyan/40 text-cyan" : "border-white/10 text-[#8b93a7]"}`}
                    >
                      {FEATURE_LABELS[key]}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
