"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Field, inputClass } from "./ui";
import { brl } from "@/lib/utils";
import { FEATURE_LABELS, type FeatureFlags } from "@/lib/features";

type Plan = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  interval: string;
  features: FeatureFlags;
};

export function LoginForm({ shopSlug }: { shopSlug?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("erro") === "suspenso" ? "Conta suspensa." : "");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, shopSlug }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Falha no login.");
      setLoading(false);
      return;
    }
    router.push(data.redirect);
    router.refresh();
  }

  async function resend() {
    if (!email) return setError("Informe o e-mail para reenviar.");
    const res = await fetch("/api/auth/resend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setInfo(data.message || "Verifique sua caixa de entrada.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="E-mail">
        <input className={inputClass()} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Senha">
        <input className={inputClass()} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      {error && <p className="text-sm text-[#ff5d73]">{error}</p>}
      {info && <p className="text-sm text-cyan">{info}</p>}
      <Button className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
      <div className="flex justify-between text-sm text-[#8b93a7]">
        <Link href="/recuperar">Esqueci a senha</Link>
        <button type="button" onClick={resend} className="text-gold">
          Reenviar confirmação
        </button>
      </div>
    </form>
  );
}

export function BarberRegisterForm() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    shopName: "",
    planId: "",
    pixKey: "",
    pixKeyType: "RANDOM",
    mpPublicKey: "",
    mpAccessToken: "",
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || []);
        if (d.plans?.[0]) setForm((f) => ({ ...f, planId: f.planId || d.plans[0].id }));
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, role: "BARBER" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok && res.status !== 201) return setError(data.error || "Falha no cadastro.");
    setOk(data.message || "Unidade criada. Confirme o e-mail.");
    setUrl(data.url || data.path || "");
  }

  const selected = plans.find((p) => p.id === form.planId);

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Seu nome">
        <input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="Nome da barbearia">
        <input className={inputClass()} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
      </Field>
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#8b93a7]">Plano</p>
        <div className="grid gap-2">
          {plans.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setForm({ ...form, planId: p.id })}
              className={`rounded-2xl border px-4 py-3 text-left ${form.planId === p.id ? "border-gold" : "border-white/10"}`}
            >
              <div className="flex justify-between gap-3">
                <span className="font-medium">{p.name}</span>
                <span className="text-cyan">{brl(p.priceCents)}/{p.interval === "YEARLY" ? "ano" : "mês"}</span>
              </div>
              <p className="mt-1 text-sm text-[#8b93a7]">{p.description}</p>
            </button>
          ))}
        </div>
        {selected && (
          <p className="mt-2 text-xs text-[#8b93a7]">
            Inclui: {Object.entries(FEATURE_LABELS)
              .filter(([k]) => selected.features[k as keyof FeatureFlags])
              .map(([, l]) => l)
              .join(" · ")}
          </p>
        )}
      </div>
      <Field label="E-mail">
        <input className={inputClass()} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </Field>
      <Field label="Telefone">
        <input className={inputClass()} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label="Senha">
        <input className={inputClass()} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </Field>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Recebimento dos seus serviços</p>
      <Field label="Tipo da chave PIX">
        <select className={inputClass()} value={form.pixKeyType} onChange={(e) => setForm({ ...form, pixKeyType: e.target.value })}>
          <option value="CPF">CPF</option>
          <option value="CNPJ">CNPJ</option>
          <option value="EMAIL">E-mail</option>
          <option value="PHONE">Telefone</option>
          <option value="RANDOM">Aleatória</option>
        </select>
      </Field>
      <Field label="Chave PIX da unidade">
        <input className={inputClass()} value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} />
      </Field>
      <Field label="Mercado Pago Public Key">
        <input className={inputClass()} value={form.mpPublicKey} onChange={(e) => setForm({ ...form, mpPublicKey: e.target.value })} />
      </Field>
      <Field label="Mercado Pago Access Token">
        <input className={inputClass()} value={form.mpAccessToken} onChange={(e) => setForm({ ...form, mpAccessToken: e.target.value })} placeholder="APP_USR-..." />
      </Field>
      {error && <p className="text-sm text-[#ff5d73]">{error}</p>}
      {ok && <p className="text-sm text-cyan">{ok}{url ? ` ${url}` : ""}</p>}
      <Button className="w-full" disabled={loading || !form.planId}>
        {loading ? "Criando unidade..." : "Criar barbearia"}
      </Button>
    </form>
  );
}

export function ClientRegisterForm({ shopSlug, shopName }: { shopSlug: string; shopName: string }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, role: "CLIENT", shopSlug }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok && res.status !== 201) return setError(data.error || "Falha no cadastro.");
    setOk(data.message || `Conta criada em ${shopName}. Confirme o e-mail.`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Nome">
        <input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      <Field label="E-mail">
        <input className={inputClass()} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </Field>
      <Field label="Telefone">
        <input className={inputClass()} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </Field>
      <Field label="Senha">
        <input className={inputClass()} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </Field>
      {error && <p className="text-sm text-[#ff5d73]">{error}</p>}
      {ok && <p className="text-sm text-cyan">{ok}</p>}
      <Button className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Criar conta nesta barbearia"}
      </Button>
    </form>
  );
}
