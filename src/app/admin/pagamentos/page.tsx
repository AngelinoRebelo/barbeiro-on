"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function AdminPagamentosPage() {
  const [form, setForm] = useState({
    pixKey: "",
    pixKeyType: "RANDOM",
    mpPublicKey: "",
    mpAccessToken: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/billing")
      .then((r) => r.json())
      .then((d) => d.billing && setForm({ ...form, ...d.billing, mpAccessToken: d.billing.mpAccessToken || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="max-w-xl">
      <h2 className="text-2xl">Caixa da plataforma</h2>
      <p className="mt-2 mb-6 text-sm text-[#8b93a7]">
        Estas credenciais recebem a mensalidade dos barbeiros. A chave PIX e o Mercado Pago de cada unidade (cortes e barbas) o barbeiro cadastra no próprio painel.
      </p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch("/api/admin/billing", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(form),
          });
          const data = await res.json();
          setMsg(res.ok ? "Credenciais da plataforma salvas." : data.error);
        }}
      >
        <Field label="Tipo da chave PIX">
          <select className={inputClass()} value={form.pixKeyType} onChange={(e) => setForm({ ...form, pixKeyType: e.target.value })}>
            <option value="CPF">CPF</option>
            <option value="CNPJ">CNPJ</option>
            <option value="EMAIL">E-mail</option>
            <option value="PHONE">Telefone</option>
            <option value="RANDOM">Aleatória</option>
          </select>
        </Field>
        <Field label="Chave PIX do admin">
          <input className={inputClass()} value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} />
        </Field>
        <Field label="Mercado Pago Public Key">
          <input className={inputClass()} value={form.mpPublicKey} onChange={(e) => setForm({ ...form, mpPublicKey: e.target.value })} />
        </Field>
        <Field label="Mercado Pago Access Token">
          <input className={inputClass()} value={form.mpAccessToken} onChange={(e) => setForm({ ...form, mpAccessToken: e.target.value })} placeholder="APP_USR-..." />
        </Field>
        {msg && <p className="text-sm text-cyan">{msg}</p>}
        <Button>Salvar caixa da plataforma</Button>
      </form>
    </Card>
  );
}
