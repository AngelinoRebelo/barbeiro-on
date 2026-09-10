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
  active: boolean;
};

export default function PlanosAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: "", description: "", price: "99,00", interval: "MONTHLY" });
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/plans");
    setPlans((await res.json()).plans || []);
  }
  useEffect(() => {
    load();
  }, []);

  function toCents(v: string) {
    return Math.round(Number(v.replace(".", "").replace(",", ".")) * 100) || 0;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <h2 className="mb-4">Valores cobrados do barbeiro</h2>
        <div className="grid gap-2">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3">
              <div>
                <p>{p.name} · {brl(p.priceCents)}/{p.interval === "YEARLY" ? "ano" : "mês"}</p>
                <p className="text-sm text-[#8b93a7]">{p.description}</p>
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
                      body: JSON.stringify({ name: p.name, priceCents: toCents(price), interval: p.interval, description: p.description }),
                    });
                    load();
                  }}
                >
                  Preço
                </Button>
                <Button variant="ghost" onClick={() => fetch(`/api/admin/plans/${p.id}`, { method: "DELETE" }).then(load)}>
                  Desativar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
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
              }),
            });
            const data = await res.json();
            if (!res.ok) setMsg(data.error);
            else {
              setForm({ name: "", description: "", price: "99,00", interval: "MONTHLY" });
              load();
            }
          }}
        >
          <Field label="Nome"><input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Descrição"><input className={inputClass()} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Preço (R$)"><input className={inputClass()} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Ciclo">
            <select className={inputClass()} value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}>
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
          </Field>
          {msg && <p className="text-sm text-[#ff5d73]">{msg}</p>}
          <Button className="w-full">Criar plano</Button>
        </form>
      </Card>
    </div>
  );
}
