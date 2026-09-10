"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
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
};

export default function PlanosAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialDays, setTrialDays] = useState("30");
  const [form, setForm] = useState({ name: "", description: "", price: "99,00", interval: "MONTHLY", durationDays: "30" });
  const [msg, setMsg] = useState("");

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
                  <p>{p.name} · {brl(p.priceCents)}/{p.interval === "YEARLY" ? "ano" : "mês"}</p>
                  <p className="text-sm text-[#8b93a7]">{p.description || "Sem descrição"} · vigência de {p.durationDays} dias</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const price = prompt("Novo valor em reais (ex: 79,00)", String((p.priceCents / 100).toFixed(2).replace(".", ",")));
                      if (!price) return;
                      await fetch(`/api/admin/plans/${p.id}`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ name: p.name, priceCents: toCents(price), interval: p.interval, description: p.description, durationDays: p.durationDays }),
                      });
                      load();
                    }}
                  >
                    Preço
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const days = prompt("Vigência em dias (ex: 30)", String(p.durationDays));
                      if (!days) return;
                      await fetch(`/api/admin/plans/${p.id}`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ name: p.name, priceCents: p.priceCents, interval: p.interval, description: p.description, durationDays: Number(days) }),
                      });
                      load();
                    }}
                  >
                    Vigência
                  </Button>
                  <Button variant="ghost" onClick={() => fetch(`/api/admin/plans/${p.id}`, { method: "DELETE" }).then(load)}>
                    Desativar
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
