"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import { FEATURE_LABELS, type FeatureFlags } from "@/lib/features";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  shopName: string | null;
  approved: boolean | null;
  features: FeatureFlags | null;
};

export default function UsuariosPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [users, setUsers] = useState<Row[]>([]);

  async function load() {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&role=${role}`);
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, body: object) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap gap-3">
        <input className={inputClass() + " max-w-sm"} placeholder="Buscar nome, e-mail ou loja" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={inputClass() + " max-w-40"} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Todos</option>
          <option value="BARBER">Barbeiros</option>
          <option value="CLIENT">Clientes</option>
          <option value="ADMIN">Admins</option>
        </select>
        <Button onClick={load}>Filtrar</Button>
      </Card>
      <div className="grid gap-3">
        {users.map((u) => (
          <Card key={u.id} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/admin/usuarios/${u.id}`} className="text-lg font-medium hover:text-gold">
                  {u.name}
                </Link>
                <p className="text-sm text-[#8b93a7]">{u.email}{u.shopName ? ` · ${u.shopName}` : ""}</p>
              </div>
              <div className="flex gap-2">
                <Badge>{u.role}</Badge>
                <Badge tone={u.status === "ACTIVE" ? "cyan" : u.status === "SUSPENDED" ? "danger" : "muted"}>{u.status}</Badge>
                {u.approved === false && <Badge tone="danger">aguardando</Badge>}
                {u.approved === true && <Badge tone="cyan">aprovado</Badge>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {u.status !== "ACTIVE" && (
                <Button variant="cyan" onClick={() => patch(u.id, { action: "verify", status: "ACTIVE" })}>
                  Ativar
                </Button>
              )}
              {u.status !== "SUSPENDED" && (
                <Button variant="danger" onClick={() => patch(u.id, { status: "SUSPENDED" })}>
                  Suspender
                </Button>
              )}
              {u.role === "BARBER" && (
                <Button variant="ghost" onClick={() => patch(u.id, { approved: !u.approved })}>
                  {u.approved ? "Revogar unidade" : "Aprovar unidade"}
                </Button>
              )}
              <Button variant="ghost" onClick={() => patch(u.id, { action: "resend" })}>
                Reenviar e-mail
              </Button>
            </div>
            {u.features && (
              <div className="flex flex-wrap gap-2 pt-1">
                {(Object.keys(FEATURE_LABELS) as (keyof FeatureFlags)[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => patch(u.id, { features: { [key]: !u.features?.[key] } })}
                    className={`rounded-full border px-3 py-1 text-xs ${u.features?.[key] ? "border-cyan/40 text-cyan" : "border-white/10 text-[#8b93a7]"}`}
                  >
                    {FEATURE_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
