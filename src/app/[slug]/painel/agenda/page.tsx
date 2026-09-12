"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Field, inputClass, Badge } from "@/components/ui";
import { brl, hm, ymd, STATUS_LABEL } from "@/lib/utils";
import { MpCheckout } from "@/components/mp-checkout-lazy";

type Client = { id: string; name: string };
type Service = { id: string; name: string; durationMin: number; priceCents: number };
type Appt = {
  id: string;
  startsAt: string;
  createdAt: string;
  status: string;
  client: { name: string };
  service: { name: string; priceCents: number };
  paid: "PAID" | "PENDING" | "UNPAID";
  queue: { position: number; ahead: number; total: number; waiting: boolean };
};

export default function AgendaPage() {
  const [date, setDate] = useState(ymd(new Date()));
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [items, setItems] = useState<Appt[]>([]);
  const [form, setForm] = useState({ clientId: "", serviceId: "", time: "10:00", notes: "" });
  const [msg, setMsg] = useState("");
  const [checkout, setCheckout] = useState<{
    appointmentId: string;
    paymentId: string;
    publicKey: string;
    amountCents: number;
    payerEmail: string;
    preferenceId: string;
  } | null>(null);

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
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
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
      setMsg("Entrou na fila do dia.");
      load();
    }
  }

  async function charge(id: string) {
    setMsg("");
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appointmentId: id }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setCheckout({
      appointmentId: id,
      paymentId: data.paymentId,
      publicKey: data.publicKey,
      amountCents: data.amountCents,
      payerEmail: data.payerEmail,
      preferenceId: data.preferenceId,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2>Fila do dia</h2>
            <p className="text-sm text-[#8b93a7]">Ordem de horário. Novos agendamentos entram sozinhos na posição certa.</p>
          </div>
          <input className={inputClass() + " max-w-44"} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="grid gap-2">
          {items.length === 0 && <p className="text-[#8b93a7]">Ninguém na fila neste dia.</p>}
          {items.map((a) => (
            <div key={a.id} className="rounded-2xl border border-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/30 text-sm text-gold">
                    {a.queue.waiting ? a.queue.position : "—"}
                  </span>
                  <div>
                    <p className="font-medium">{a.client.name}</p>
                    <p className="text-sm text-[#8b93a7]">
                      {hm(new Date(a.startsAt))} · {a.service.name} · {brl(a.service.priceCents)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Badge>{STATUS_LABEL[a.status] || a.status}</Badge>
                  <Badge tone={a.paid === "PAID" ? "cyan" : a.paid === "PENDING" ? "gold" : "danger"}>
                    {a.paid === "PAID" ? "Pago" : a.paid === "PENDING" ? "Pagando" : "A pagar"}
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.status !== "DONE" && a.status !== "CANCELLED" && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      fetch(`/api/barber/appointments/${a.id}`, {
                        method: "PATCH",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ status: "DONE" }),
                      }).then(load)
                    }
                  >
                    Concluir
                  </Button>
                )}
                {a.paid !== "PAID" && (
                  <Button variant="cyan" onClick={() => charge(a.id)}>
                    Cobrar PIX/cartão
                  </Button>
                )}
              </div>
              {checkout?.appointmentId === a.id && (
                <div className="mt-4 border-t border-white/5 pt-4">
                  <MpCheckout
                    paymentId={checkout.paymentId}
                    publicKey={checkout.publicKey}
                    amountCents={checkout.amountCents}
                    payerEmail={checkout.payerEmail}
                    preferenceId={checkout.preferenceId}
                    onPaid={() => {
                      setCheckout(null);
                      load();
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {msg && <p className="mt-3 text-sm text-cyan">{msg}</p>}
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
          <Button className="w-full">Agendar</Button>
        </form>
      </Card>
    </div>
  );
}