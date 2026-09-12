"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Field, inputClass } from "@/components/ui";
import { brl } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  interval: string;
  durationDays: number;
  active: boolean;
  units?: number;
};

export default function PlanosAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialDays, setTrialDays] = useState("15");
  const [form, setForm] = useState({ name: "", description: "", price: "99,00", interval: "MONTHLY", durationDays: "30" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const [plansRes, billingRes] = await Promise.all([fetch("/api/admin/plans"), fetch("/api/admin/billing")]);
    setPlans((await plansRes.json()).plans || []);
    const billing = await billingRes.json();
    if (typeof billing.trialDays === "number") setTrialDays(String(billing.trialDays));
  }
  useEffect(() => {
    load();
  }, []);

  function toCents(v: string) {
    return Math.round(Number(v.replace(".", "").replace(",", ".")) * 100) || 0;
  }

  async function patchPlan(id: string, body: object, okMsg: string) {
    setBusy(id);
    setMsg("");
    const res = await fetch(`/api/admin/plans/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setMsg(data.error || "Não foi possível atualizar o plano.");
    setMsg(okMsg);
    await load();
  }

  async function removePlan(p: Plan) {
    const units = p.units || 0;
    const warn = units
      ? `Excluir o plano ${p.name}? ${units} unidade${units === 1 ? "" : "s"} deixam de ter este plano.`
      : `Excluir o plano ${p.name}? Esta ação não pode ser desfeita.`;
    if (!confirm(warn)) return;
    setBusy(p.id);
    setMsg("");
    const res = await fetch(`/api/admin/plans/${p.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) return setMsg(data.error || "Não foi possível excluir o plano.");
    setMsg(`${p.name} foi excluído.`);
    await load();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Card>
          <h2 className="mb-2">Período de teste</h2>
          <p className="mb-4 text-sm text-[#8b93a7]">
            Toda nova unidade começa com este prazo, sem cobrança. O admin pode alterar o padrão e acrescentar dias em cada barbeiro.
          </p>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch("/api/admin/billing", {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ trialDays: Number(trialDays) }),
              });
              const data = await res.json();
              setMsg(res.ok ? `Teste padrão: ${data.trialDays} dias.` : data.error);
            }}
          >
            <Field label="Dias de teste">
              <input className={inputClass() + " w-28"} type="number" min={0} max={3650} value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
            </Field>
            <Button>Salvar teste</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4">Valores e vigência dos planos</h2>
          <div className="grid gap-2">
            {plans.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 px-4 py-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2">
                    {p.name} · {brl(p.priceCents)}/{p.interval === "YEARLY" ? "ano" : "mês"}
                    <Badge tone={p.active ? "cyan" : "muted"}>{p.active ? "ativo" : "off"}</Badge>
                  </p>
                  <p className="text-sm text-[#8b93a7]">{p.description || "Sem descrição"} · vigência de {p.durationDays} dias</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy === p.id}
                    onClick={async () => {
                      const price = prompt("Novo valor em reais (ex: 79,00)", String((p.priceCents / 100).toFixed(2).replace(".", ",")));
                      if (!price) return;
                      await patchPlan(p.id, { priceCents: toCents(price) }, `Preço de ${p.name} atualizado.`);
                    }}
                  >
                    Preço
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy === p.id}
                    onClick={async () => {
                      const days = prompt("Vigência em dias (ex: 30)", String(p.durationDays));
                      if (!days) return;
                      await patchPlan(p.id, { durationDays: Number(days) }, `Vigência de ${p.name} atualizada.`);
                    }}
                  >
                    Vigência
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy === p.id}
                    onClick={() => patchPlan(p.id, { active: !p.active }, p.active ? `${p.name} desativado.` : `${p.name} ativado.`)}
                  >
                    {p.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button type="button" variant="danger" disabled={busy === p.id} onClick={() => removePlan(p)}>
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {msg && <p className="mt-3 text-sm text-cyan">{msg}</p>}
        </Card>
      </div>
      <Card>
        <h2 className="mb-4">Novo plano</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/admin/plans", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name: form.name,
                description: form.description,
                priceCents: toCents(form.price),
                interval: form.interval,
                durationDays: Number(form.durationDays) || (form.interval === "YEARLY" ? 365 : 30),
              }),
            });
            const data = await res.json();
            if (!res.ok) setMsg(data.error);
            else {
              setForm({ name: "", description: "", price: "99,00", interval: "MONTHLY", durationDays: "30" });
              load();
            }
          }}
        >
          <Field label="Nome"><input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Descrição"><input className={inputClass()} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Preço (R$)"><input className={inputClass()} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Ciclo">
            <select
              className={inputClass()}
              value={form.interval}
              onChange={(e) => {
                const interval = e.target.value;
                setForm({ ...form, interval, durationDays: interval === "YEARLY" ? "365" : "30" });
              }}
            >
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
          </Field>
          <Field label="Vigência (dias)">
            <input className={inputClass()} type="number" min={1} max={3650} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
          </Field>
          {msg && <p className="text-sm text-[#ff5d73]">{msg}</p>}
          <Button className="w-full">Criar plano</Button>
        </form>
      </Card>
    </div>
  );
}
