"use client";

import { useEffect, useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";

export default function ConfigPage() {
  const [form, setForm] = useState({
    shopName: "",
    bio: "",
    address: "",
    city: "",
    openTime: "09:00",
    closeTime: "20:00",
    pixKey: "",
    pixKeyType: "RANDOM",
    mpPublicKey: "",
    mpAccessToken: "",
    slug: "",
  });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/barber/settings")
      .then((r) => r.json())
      .then((d) => d.profile && setForm({ ...form, ...d.profile, mpAccessToken: d.profile.mpAccessToken || "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4">Unidade</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/barber/settings", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(form),
            });
            const data = await res.json();
            setMsg(res.ok ? "Unidade atualizada." : data.error);
          }}
        >
          <Field label="Nome da barbearia"><input className={inputClass()} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} /></Field>
          <Field label="Cidade"><input className={inputClass()} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Endereço"><input className={inputClass()} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Bio"><textarea className={inputClass()} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Abre"><input className={inputClass()} type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} /></Field>
            <Field label="Fecha"><input className={inputClass()} type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} /></Field>
          </div>
          <Button>Salvar unidade</Button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-2">Recebimentos do contratante</h2>
        <p className="mb-4 text-sm text-[#8b93a7]">Cadastre a chave PIX da barbearia e as credenciais do Mercado Pago (Public Key + Access Token) para cartão.</p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/barber/settings", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                payments: {
                  pixKey: form.pixKey,
                  pixKeyType: form.pixKeyType,
                  mpPublicKey: form.mpPublicKey,
                  mpAccessToken: form.mpAccessToken,
                },
              }),
            });
            const data = await res.json();
            setMsg(res.ok ? "Pagamentos salvos." : data.error);
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
          <Field label="Chave PIX"><input className={inputClass()} value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} /></Field>
          <Field label="Mercado Pago Public Key"><input className={inputClass()} value={form.mpPublicKey} onChange={(e) => setForm({ ...form, mpPublicKey: e.target.value })} /></Field>
          <Field label="Mercado Pago Access Token"><input className={inputClass()} value={form.mpAccessToken} onChange={(e) => setForm({ ...form, mpAccessToken: e.target.value })} placeholder="APP_USR-..." /></Field>
          {msg && <p className="text-sm text-cyan">{msg}</p>}
          <Button variant="cyan">Salvar pagamentos</Button>
        </form>
      </Card>
    </div>
  );
}
