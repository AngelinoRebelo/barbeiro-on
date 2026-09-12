"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import { FEATURE_LABELS, type FeatureFlags } from "@/lib/features";
import { formatDay } from "@/lib/utils";

type Plan = { id: string; name: string; durationDays: number };
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
  accessUntil: string | null;
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
  const [selectedPlan, setSelectedPlan] = useState<Record<string, string>>({});
  const [extraDays, setExtraDays] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  async function load() {
    const [usersRes, plansRes] = await Promise.all([
      fetch(`/api/admin/users?q=${encodeURIComponent(q)}&role=${role}`),
      fetch("/api/admin/plans"),
    ]);
    const usersData = await usersRes.json();
    const plansData = await plansRes.json();
    setMe(usersData.me || "");
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
      return;
    }
    await load();
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
      <div className="grid gap-3">
        {users.map((u) => {
          const left = daysLeft(u.accessUntil);
          const planValue = selectedPlan[u.id] || u.planId || plans[0]?.id || "";
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
                      {u.accessUntil
                        ? ` · vigente até ${formatDay(new Date(u.accessUntil))} (${left} dia${left === 1 ? "" : "s"})`
                        : " · sem vigência"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge>{u.role === "ADMIN" ? "Admin" : u.role === "BARBER" ? "Barbeiro" : "Cliente"}</Badge>
                  <Badge tone={u.status === "ACTIVE" ? "cyan" : u.status === "SUSPENDED" ? "danger" : "muted"}>
                    {u.status === "ACTIVE" ? "Ativo" : u.status === "SUSPENDED" ? "Suspenso" : "Aguardando e-mail"}
                  </Badge>
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
