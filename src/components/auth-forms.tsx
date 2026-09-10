"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Field, inputClass } from "./ui";

export function LoginForm() {
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
      body: JSON.stringify({ email, password }),
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

export function RegisterForm() {
  const [role, setRole] = useState<"BARBER" | "CLIENT">("BARBER");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", shopName: "" });
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
      body: JSON.stringify({ ...form, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok && res.status !== 201) return setError(data.error || "Falha no cadastro.");
    setOk(data.message || data.error || "Confirme o e-mail enviado por BARBEIRO_ON.");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[rgba(212,175,55,0.2)] p-1">
        {(["BARBER", "CLIENT"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-xl py-2 text-sm ${role === r ? "bg-gold text-[#07080c]" : "text-[#c6ccda]"}`}
          >
            {r === "BARBER" ? "Sou barbeiro" : "Sou cliente"}
          </button>
        ))}
      </div>
      <Field label="Nome">
        <input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </Field>
      {role === "BARBER" && (
        <Field label="Nome da barbearia">
          <input className={inputClass()} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
        </Field>
      )}
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
        {loading ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
