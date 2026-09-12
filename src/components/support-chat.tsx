"use client";

import { useEffect, useRef, useState } from "react";
import { SUPPORT_QUICK_QUESTIONS, SUPPORT_WELCOME } from "@/lib/support-faq";

type Msg = { role: "user" | "bot"; text: string; idle?: boolean };

const STORAGE_KEY = "bo.supportChat.thread.v1";
const IDLE_WARN_MS = 40_000;
const IDLE_CLOSE_MS = 80_000;
const IDLE_TEXT = "Sem resposta. Esta conversa será encerrada automaticamente por inatividade se você não interagir em breve.";

function loadThread(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((m) => m && (m.role === "user" || m.role === "bot") && typeof m.text === "string");
  } catch {
    return [];
  }
}

function saveThread(thread: Msg[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thread.slice(-80)));
  } catch {
    /* quota */
  }
}

function formatReply(text: string) {
  const esc = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>").replace(/\*/g, "");
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [escalate, setEscalate] = useState({ name: "", email: "", body: "", status: "" });
  const [quickOpen, setQuickOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const idleRef = useRef<number[]>([]);

  useEffect(() => {
    const saved = loadThread();
    setThread(saved.length ? saved : [{ role: "bot", text: SUPPORT_WELCOME }]);
  }, []);

  useEffect(() => {
    if (thread.length) saveThread(thread);
  }, [thread]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [thread, typing, open]);

  function clearIdle() {
    for (const id of idleRef.current) window.clearTimeout(id);
    idleRef.current = [];
  }

  function scheduleIdle() {
    clearIdle();
    const warn = window.setTimeout(() => {
      setThread((current) => {
        const next = [...current, { role: "bot" as const, text: IDLE_TEXT, idle: true }];
        saveThread(next);
        return next;
      });
      const close = window.setTimeout(() => reset("Conversa encerrada por inatividade."), IDLE_CLOSE_MS);
      idleRef.current.push(close);
    }, IDLE_WARN_MS);
    idleRef.current.push(warn);
  }

  function reset(notice?: string) {
    clearIdle();
    setTyping(false);
    const next = [{ role: "bot" as const, text: SUPPORT_WELCOME }];
    setThread(next);
    saveThread(next);
    if (notice) setEscalate((s) => ({ ...s, status: notice }));
  }

  async function sendText(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    clearIdle();
    setQuickOpen(false);
    setBusy(true);
    setInput("");
    const prior = thread;
    const withUser = [...prior, { role: "user" as const, text }];
    setThread(withUser);
    setTyping(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: prior.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = String(data.reply || "Não consegui responder agora. Tente de novo ou envie mensagem à equipe.");
      setThread([...withUser, { role: "bot", text: reply }]);
      scheduleIdle();
    } finally {
      setTyping(false);
      setBusy(false);
    }
  }

  async function sendToTeam() {
    const body = escalate.body.trim();
    if (!body) return setEscalate((s) => ({ ...s, status: "Escreva uma mensagem antes de enviar." }));
    setEscalate((s) => ({ ...s, status: "Enviando..." }));
    const res = await fetch("/api/support/ticket", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, name: escalate.name, email: escalate.email }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setEscalate((s) => ({ ...s, status: data.error || "Não foi possível enviar." }));
    const ack = "Sua mensagem foi enviada. Em breve a equipe entra em contato.";
    setEscalate({ name: "", email: "", body: "", status: ack });
    setThread((current) => [...current, { role: "bot", text: ack }]);
    scheduleIdle();
  }

  return (
    <>
      {open && (
        <div className="support-chat">
          <div className="support-chat__backdrop" onClick={() => setOpen(false)} />
          <div className="support-chat__panel" role="dialog" aria-modal="true" aria-labelledby="support-chat-title">
            <header className="support-chat__head">
              <button type="button" className="support-chat__back" aria-label="Voltar" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                </svg>
              </button>
              <div className="support-chat__brand">
                <h2 className="support-chat__title" id="support-chat-title">
                  Suporte
                </h2>
                <p className="support-chat__subtitle">Dúvidas sobre o uso do sistema · respostas automáticas nesta conversa</p>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" className="support-chat__end-conv" onClick={() => reset("Conversa encerrada. Você pode começar de novo.")}>
                  Encerrar
                </button>
                <button type="button" className="support-chat__close" aria-label="Fechar" onClick={() => setOpen(false)}>
                  ×
                </button>
              </div>
            </header>

            <div className="support-chat__stack">
              <div className="support-chat__messages" ref={boxRef} role="log" aria-live="polite">
                {thread.map((m, i) => (
                  <div key={`${i}-${m.role}`} className={`support-chat__bubble support-chat__bubble--${m.role}`}>
                    <div
                      className={`support-chat__bubble-inner${m.idle ? " support-chat__idle" : ""}`}
                      dangerouslySetInnerHTML={{ __html: formatReply(m.text) }}
                    />
                  </div>
                ))}
                {typing && (
                  <div className="support-chat__bubble support-chat__bubble--bot">
                    <div className="support-chat__bubble-inner">
                      <span className="support-chat__typing">Escrevendo…</span>
                    </div>
                  </div>
                )}
              </div>

              <form
                className="support-chat__form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendText(input);
                }}
              >
                <label className="visually-hidden" htmlFor="support-chat-input">
                  Sua mensagem
                </label>
                <input
                  id="support-chat-input"
                  className="support-chat__input"
                  placeholder="Digite sua mensagem…"
                  maxLength={500}
                  value={input}
                  disabled={busy}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="support-chat__send" aria-label="Enviar" disabled={busy}>
                  ➤
                </button>
              </form>

              <details className="support-chat__quick-details" open={quickOpen} onToggle={(e) => setQuickOpen((e.target as HTMLDetailsElement).open)}>
                <summary className="support-chat__quick-summary">Perguntas prontas</summary>
                <p className="support-chat__quick-hint">Toque num tema para enviar ao assistente</p>
                <div className="support-chat__quick">
                  {SUPPORT_QUICK_QUESTIONS.map((q) => (
                    <button key={q} type="button" className="support-chat__chip" disabled={busy} onClick={() => void sendText(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </details>
            </div>

            <details className="support-chat__escalate-details" open={teamOpen} onToggle={(e) => setTeamOpen((e.target as HTMLDetailsElement).open)}>
              <summary className="support-chat__escalate-summary">Não resolveu? Mensagem à equipe</summary>
              <div className="support-chat__escalate">
                <p className="support-chat__escalate-lead">
                  Só o texto abaixo é enviado ao administrador — <strong>não</strong> enviamos o histórico do chat automaticamente. Se você já estiver logado, o e-mail da conta vale mesmo com o campo vazio.
                </p>
                <input
                  className="support-chat__mail"
                  placeholder="Seu nome"
                  value={escalate.name}
                  onChange={(e) => setEscalate({ ...escalate, name: e.target.value })}
                />
                <input
                  className="support-chat__mail"
                  type="email"
                  placeholder="Seu e-mail para retorno"
                  value={escalate.email}
                  onChange={(e) => setEscalate({ ...escalate, email: e.target.value })}
                />
                <textarea
                  className="support-chat__textarea"
                  rows={3}
                  maxLength={4000}
                  placeholder="Ex.: Não consigo liberar horário… / O Pix não confirma…"
                  value={escalate.body}
                  onChange={(e) => setEscalate({ ...escalate, body: e.target.value })}
                />
                <button type="button" className="support-chat__escalate-send" onClick={() => void sendToTeam()}>
                  Enviar mensagem ao suporte
                </button>
                {escalate.status ? <p className="support-chat__escalate-status">{escalate.status}</p> : null}
              </div>
            </details>
          </div>
        </div>
      )}

      <button
        type="button"
        className="support-chat-fab"
        aria-label="Abrir suporte online"
        title="Suporte — assistente virtual"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
          />
        </svg>
      </button>
    </>
  );
}
