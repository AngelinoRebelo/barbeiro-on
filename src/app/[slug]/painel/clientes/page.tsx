"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, OpNotice, inputClass } from "@/components/ui";

type Client = { id: string; name: string; phone: string; email: string; notes: string };

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(true);

  async function load() {
    const res = await fetch("/api/barber/clients");
    const data = await res.json();
    setClients(data.clients || []);
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <h2 className="mb-4">Base de clientes</h2>
        <div className="mb-3">
          <OpNotice ok={ok} text={msg} />
        </div>
        <div className="grid gap-2">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-white/5 px-4 py-3">
              <div>
                <p>{c.name}</p>
                <p className="text-sm text-[#8b93a7]">{c.phone} {c.email}</p>
              </div>
              <Button
                variant="ghost"
                onClick={async () => {
                  const password = window.prompt("Confirme com sua senha para excluir este cliente.");
                  if (!password) return;
                  const res = await fetch(`/api/barber/clients/${c.id}`, {
                    method: "DELETE",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ password }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setOk(false);
                    setMsg(data.error || "Não foi possível excluir.");
                  } else {
                    setOk(true);
                    setMsg("Cliente excluído.");
                    load();
                  }
                }}
              >
                Remover
              </Button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="mb-4">Novo cliente</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/barber/clients", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
              setOk(false);
              setMsg(data.error || "Não foi possível salvar.");
            } else {
              setOk(true);
              setMsg("Cliente salvo.");
              setForm({ name: "", phone: "", email: "", notes: "" });
              load();
            }
          }}
        >
          <Field label="Nome"><input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="Telefone"><input className={inputClass()} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="E-mail"><input className={inputClass()} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {msg && <OpNotice ok={ok} text={msg} />}
          <Button className="w-full">Salvar</Button>
        </form>
      </Card>
    </div>
  );
}
