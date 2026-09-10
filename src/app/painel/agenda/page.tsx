"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Field, inputClass, Badge } from "@/components/ui";
import { brl, ymd } from "@/lib/utils";

type Client = { id: string; name: string };
type Service = { id: string; name: string; durationMin: number; priceCents: number };
type Appt = {
  id: string;
  startsAt: string;
  status: string;
  client: { name: string };
  service: { name: string; priceCents: number };
};

export default function AgendaPage() {
  const [date, setDate] = useState(ymd(new Date()));
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<Appt[]>([]);
  const [form, setForm] = useState({ clientId: "", serviceId: "", time: "10:00", notes: "" });
  const [msg, setMsg] = useState("");

  async function load() {
    const [c, s, a] = await Promise.all([
      fetch("/api/barber/clients").then((r) => r.json()),
      fetch("/api/barber/services").then((r) => r.json()),
      fetch(`/api/barber/appointments?date=${date}`).then((r) => r.json()),
    ]);
    setClients(c.clients || []);
    setServices((s.services || []).filter((x: Service & { active?: boolean }) => x.active !== false));
    setItems(a.appointments || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const times = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h <= 21; h++) {
      out.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
    }
    return out;
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/barber/appointments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, date }),
    });
    const data = await res.json();
    if (!res.ok) setMsg(data.error);
    else {
      setMsg("Horário reservado.");
      load();
    }
  }

  async function pay(id: string, method: "PIX" | "MERCADOPAGO") {
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appointmentId: id, method }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    if (data.initPoint) window.location.href = data.initPoint;
    else window.location.href = data.redirect;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2>Dia</h2>
          <input className={inputClass() + " max-w-44"} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          {items.length === 0 && <p className="text-[#8b93a7]">Nenhum horário neste dia.</p>}
          {items.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{a.client.name}</p>
                  <p className="text-sm text-[#8b93a7]">
                    {new Date(a.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {a.service.name} · {brl(a.service.priceCents)}
                  </p>
                </div>
                <Badge>{a.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => fetch(`/api/barber/appointments/${a.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "DONE" }) }).then(load)}>
                  Concluir
                </Button>
                <Button variant="ghost" onClick={() => pay(a.id, "PIX")}>PIX</Button>
                <Button variant="cyan" onClick={() => pay(a.id, "MERCADOPAGO")}>Cartão MP</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4">Novo horário</h2>
        <form className="space-y-3" onSubmit={create}>
          <Field label="Cliente">
            <select className={inputClass()} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
              <option value="">Selecionar</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Serviço">
            <select className={inputClass()} value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} required>
              <option value="">Selecionar</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Hora">
            <select className={inputClass()} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}>
              {times.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          {msg && <p className="text-sm text-cyan">{msg}</p>}
          <Button className="w-full">Agendar</Button>
        </form>
      </Card>
    </div>
  );
}
