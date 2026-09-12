"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { formatWhen } from "@/lib/utils";

type Ticket = {
  id: string;
  name: string;
  email: string;
  role: string;
  shopSlug: string;
  body: string;
  status: string;
  createdAt: string;
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/admin/support");
    const data = await res.json();
    setTickets(data.tickets || []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function setStatus(id: string, status: string) {
    const res = await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(data.error || "Não foi possível atualizar.");
    else await load();
  }

  const open = tickets.filter((t) => t.status !== "DONE");
  const done = tickets.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-4">
      <Card>
        <h2>Pedidos pelo chat de suporte</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">
          Mensagens enviadas em <strong>Não resolveu? Mensagem à equipe</strong>. O assistente responde sozinho; estes são os chamados humanos.
        </p>
        {msg && <p className="mt-3 text-sm text-[#ff5d73]">{msg}</p>}
      </Card>
      <Card>
        <h2 className="mb-4">Abertos · {open.length}</h2>
        <div className="grid gap-2">
          {open.length === 0 && <p className="text-sm text-[#8b93a7]">Nenhum chamado aberto.</p>}
          {open.map((t) => (
            <article key={t.id} className="rounded-2xl border border-white/5 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  {t.name} · {t.email}
                  {t.shopSlug ? ` · /${t.shopSlug}` : ""}
                </p>
                <Badge>{t.role || "visitante"}</Badge>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[#c6ccda]">{t.body}</p>
              <p className="mt-2 text-xs text-[#8b93a7]">{formatWhen(new Date(t.createdAt))}</p>
              <div className="mt-3">
                <Button type="button" variant="ghost" onClick={() => setStatus(t.id, "DONE")}>
                  Marcar como resolvido
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Card>
      {done.length > 0 && (
        <details className="fold rounded-2xl border border-white/5">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
            <span className="font-semibold">Resolvidos · {done.length}</span>
            <span className="chev text-[#8b93a7]">▾</span>
          </summary>
          <div className="grid gap-2 border-t border-white/5 px-3 py-3">
            {done.map((t) => (
              <article key={t.id} className="rounded-2xl border border-white/5 px-4 py-3">
                <p className="text-sm">
                  {t.name} · {t.email}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[#8b93a7]">{t.body}</p>
                <Button type="button" variant="ghost" className="mt-2" onClick={() => setStatus(t.id, "OPEN")}>
                  Reabrir
                </Button>
              </article>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
