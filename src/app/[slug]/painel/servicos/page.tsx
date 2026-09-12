"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, inputClass, Badge, OpNotice } from "@/components/ui";
import { brl, CATEGORY_LABEL } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  category: string;
  durationMin: number;
  priceCents: number;
  active: boolean;
};

export default function ServicosPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: "", category: "HAIR", durationMin: 30, price: "45,00" });
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(true);

  async function load() {
    const res = await fetch("/api/barber/services");
    setItems((await res.json()).services || []);
  }
  useEffect(() => { load(); }, []);

  function toCents(v: string) {
    return Math.round(Number(v.replace(".", "").replace(",", ".")) * 100) || 0;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <h2 className="mb-4">Catálogo</h2>
        <div className="mb-3">
          <OpNotice ok={ok} text={msg} />
        </div>
        <div className="grid gap-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3">
              <div>
                <p>{s.name}</p>
                <p className="text-sm text-[#8b93a7]">{CATEGORY_LABEL[s.category]} · {s.durationMin} min · {brl(s.priceCents)}</p>
              </div>
              <div className="flex gap-2">
                <Badge tone={s.active ? "cyan" : "muted"}>{s.active ? "ativo" : "off"}</Badge>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const res = await fetch(`/api/barber/services/${s.id}`, { method: "DELETE" });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      setOk(false);
                      setMsg(data.error || "Não foi possível desativar.");
                      return;
                    }
                    setOk(true);
                    setMsg("Serviço desativado.");
                    load();
                  }}
                >
                  Desativar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4">Novo serviço</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/barber/services", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                name: form.name,
                category: form.category,
                durationMin: form.durationMin,
                priceCents: toCents(form.price),
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setOk(false);
              setMsg(data.error || "Não foi possível adicionar.");
              return;
            }
            setOk(true);
            setMsg("Serviço adicionado.");
            setForm({ name: "", category: "HAIR", durationMin: 30, price: "45,00" });
            load();
          }}
        >
          <Field label="Nome"><input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Categoria">
            <select className={inputClass()} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="HAIR">Cabelo</option>
              <option value="BEARD">Barba</option>
              <option value="COMBO">Combo</option>
              <option value="OTHER">Outro</option>
            </select>
          </Field>
          <Field label="Duração (min)">
            <input className={inputClass()} type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} />
          </Field>
          <Field label="Preço (R$)">
            <input className={inputClass()} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <OpNotice ok={ok} text={msg} />
          <Button className="w-full">Adicionar</Button>
        </form>
      </Card>
    </div>
  );
}
