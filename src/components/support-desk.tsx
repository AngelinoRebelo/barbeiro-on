"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import { formatWhen } from "@/lib/utils";

type Msg = {
  id: string;
  authorRole: string;
  authorName: string;
  body: string;
  createdAt: string;
};

type Ticket = {
  id: string;
  name: string;
  email: string;
  role: string;
  shopSlug: string;
  subject: string;
  body: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  messages?: Msg[];
};

function roleLabel(role: string) {
  if (role === "ADMIN") return "Suporte";
  if (role === "BARBER") return "Barbeiro";
  if (role === "CLIENT") return "Cliente";
  return "Visitante";
}

export function SupportDesk({
  endpoint = "/api/support/tickets",
  admin = false,
}: {
  endpoint?: string;
  admin?: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const selectedId = params.get("id") || "";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [composer, setComposer] = useState({ name: "", email: "", body: "" });
  const boxRef = useRef<HTMLDivElement>(null);

  async function loadList() {
    const res = await fetch(endpoint, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setTickets(data.tickets || []);
  }

  async function loadOne(id: string) {
    if (!id) {
      setTicket(null);
      return;
    }
    const res = await fetch(`${endpoint}/${id}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setTicket(data.ticket);
  }

  useEffect(() => {
    void loadList();
  }, [endpoint]);

  useEffect(() => {
    void loadOne(selectedId);
    const t = window.setInterval(() => {
      void loadList();
      if (selectedId) void loadOne(selectedId);
    }, 5000);
    return () => window.clearInterval(t);
  }, [selectedId, endpoint]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [ticket?.messages?.length]);

  const open = useMemo(() => tickets.filter((t) => t.status !== "CLOSED"), [tickets]);
  const closed = useMemo(() => tickets.filter((t) => t.status === "CLOSED"), [tickets]);

  function select(id: string) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("id", id);
    else url.searchParams.delete("id");
    router.replace(`${url.pathname}${url.search}`);
  }

  async function send() {
    if (!ticket || !draft.trim()) return;
    setBusy(true);
    setMsg("");
    const res = await fetch(`${endpoint}/${ticket.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error || "Não foi possível enviar.");
    setDraft("");
    setTicket(data.ticket);
    await loadList();
  }

  async function setStatus(status: "OPEN" | "CLOSED") {
    if (!ticket) return;
    setBusy(true);
    const res = await fetch(`${endpoint}/${ticket.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error || "Não foi possível atualizar.");
    setTicket(data.ticket);
    await loadList();
  }

  async function openNew() {
    if (!composer.body.trim()) return setMsg("Escreva a mensagem da chamada.");
    setBusy(true);
    setMsg("");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(composer),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg(data.error || "Não foi possível abrir o chamado.");
    setComposer({ name: "", email: "", body: "" });
    await loadList();
    if (data.id) select(data.id);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="lg:max-h-[70vh] lg:overflow-y-auto">
        <h2>Conversas</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">
          {admin
            ? "Barbeiros e clientes da rede. O admin recebe e-mail ao abrir e ao encerrar."
            : "Fale com o suporte da plataforma. O admin é avisado por e-mail."}
        </p>
        {msg && <p className="mt-3 text-sm text-[#ff5d73]">{msg}</p>}
        <div className="mt-4 grid gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Abertas · {open.length}</p>
          {open.length === 0 && <p className="text-sm text-[#8b93a7]">Nenhuma conversa aberta.</p>}
          {open.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => select(t.id)}
              className={`rounded-2xl border px-3 py-2 text-left ${selectedId === t.id ? "border-gold/50 bg-[rgba(212,175,55,0.12)]" : "border-white/5"}`}
            >
              <p className="text-sm font-semibold">{t.subject || t.body.slice(0, 60)}</p>
              <p className="mt-1 text-xs text-[#8b93a7]">
                {t.name} · {roleLabel(t.role)}
                {t.shopSlug ? ` · /${t.shopSlug}` : ""}
              </p>
            </button>
          ))}
        </div>
        {closed.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-[#8b93a7]">Encerradas · {closed.length}</summary>
            <div className="mt-2 grid gap-2">
              {closed.map((t) => (
                <button key={t.id} type="button" onClick={() => select(t.id)} className="rounded-2xl border border-white/5 px-3 py-2 text-left text-sm text-[#8b93a7]">
                  {t.subject || t.body.slice(0, 60)}
                </button>
              ))}
            </div>
          </details>
        )}
        {!admin && (
          <div className="mt-6 space-y-2 border-t border-white/5 pt-4">
            <p className="text-sm font-semibold">Nova chamada</p>
            <textarea
              className={inputClass()}
              rows={3}
              placeholder="Descreva o que não funcionou…"
              value={composer.body}
              onChange={(e) => setComposer({ ...composer, body: e.target.value })}
            />
            <Button type="button" disabled={busy} onClick={() => void openNew()}>
              Abrir conversa
            </Button>
          </div>
        )}
      </Card>
      <Card className="flex min-h-[28rem] flex-col">
        {!ticket && <p className="text-sm text-[#8b93a7]">Escolha uma conversa ao lado.</p>}
        {ticket && (
          <>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2>{ticket.subject || "Conversa"}</h2>
                <p className="mt-1 text-sm text-[#8b93a7]">
                  {ticket.name} · {ticket.email}
                  {ticket.shopSlug ? ` · /${ticket.shopSlug}` : ""} · {roleLabel(ticket.role)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={ticket.status === "CLOSED" ? "muted" : "cyan"}>{ticket.status === "CLOSED" ? "Encerrada" : "Aberta"}</Badge>
                {ticket.status === "CLOSED" ? (
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => void setStatus("OPEN")}>
                    Reabrir
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => void setStatus("CLOSED")}>
                    Encerrar
                  </Button>
                )}
              </div>
            </div>
            <div ref={boxRef} className="mb-4 max-h-[46vh] flex-1 space-y-2 overflow-y-auto pr-1">
              {(ticket.messages || []).map((m) => (
                <article
                  key={m.id}
                  className={`rounded-2xl border px-4 py-3 ${m.authorRole === "ADMIN" ? "border-cyan/25 bg-[rgba(94,234,212,0.06)]" : "border-white/5"}`}
                >
                  <p className="text-xs text-[#8b93a7]">
                    {m.authorName || roleLabel(m.authorRole)} · {roleLabel(m.authorRole)} · {formatWhen(new Date(m.createdAt))}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
                </article>
              ))}
            </div>
            {ticket.status === "CLOSED" ? (
              <p className="text-sm text-[#8b93a7]">Conversa encerrada. Reabra para continuar.</p>
            ) : (
              <form
                className="mt-auto space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <textarea
                  className={inputClass()}
                  rows={3}
                  placeholder={admin ? "Responder ao barbeiro ou cliente…" : "Escreva para o suporte…"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <Button type="submit" disabled={busy || !draft.trim()}>
                  Enviar
                </Button>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
