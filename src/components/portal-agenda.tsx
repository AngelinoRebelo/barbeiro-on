"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { brl, formatWhen, STATUS_LABEL } from "@/lib/utils";
import { shopPath } from "@/lib/paths";
import { queueLabel, type QueueInfo } from "@/lib/queue-view";
import { MpCheckout } from "@/components/mp-checkout-lazy";

type Row = {
  id: string;
  startsAt: string;
  status: string;
  paid: "PAID" | "PENDING" | "UNPAID";
  queue: QueueInfo;
  service: { name: string; priceCents: number };
  barber: { shopName: string; slug: string };
};

function Fold({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <details className="fold rounded-2xl border border-white/5">
      <summary className="flex items-center justify-between gap-3 px-4 py-3">
        <span>
          <span className="font-semibold">{title}</span>
          <span className="ml-3 text-xs text-[#8b93a7]">Clique para ver</span>
        </span>
        <span className="flex items-center gap-2">
          <Badge tone="muted">{count}</Badge>
          <span className="chev text-[#8b93a7]">▾</span>
        </span>
      </summary>
      <div className="grid gap-2 border-t border-white/5 px-3 py-3">{children}</div>
    </details>
  );
}

export function PortalAgenda({ slug }: { slug: string }) {
  const [items, setItems] = useState<Row[]>([]);
  const [checkout, setCheckout] = useState<{
    appointmentId: string;
    paymentId: string;
    publicKey: string;
    amountCents: number;
    payerEmail: string;
    preferenceId: string;
  } | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/portal/appointments");
    const data = await res.json();
    setItems((data.appointments || []).filter((a: Row) => a.barber.slug === slug));
  }

  useEffect(() => {
    load();
    const live = new EventSource(`/api/shop/${slug}/live`);
    const refresh = () => {
      void load();
    };
    live.addEventListener("slots", refresh);
    live.addEventListener("queue", refresh);
    const timer = setInterval(load, 8000);
    return () => {
      live.close();
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function pay(id: string) {
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

  const { active, cancelled, done } = useMemo(() => {
    const cancelledRows = items.filter((a) => a.status === "CANCELLED");
    const doneRows = items.filter((a) => a.status === "DONE" || a.status === "NO_SHOW");
    const activeRows = items
      .filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED")
      .sort((a, b) => {
        if (a.queue.waiting !== b.queue.waiting) return a.queue.waiting ? -1 : 1;
        if (a.queue.waiting && b.queue.waiting) return a.queue.position - b.queue.position;
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });
    const byRecent = (a: Row, b: Row) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    return {
      active: activeRows,
      cancelled: cancelledRows.sort(byRecent),
      done: doneRows.sort(byRecent),
    };
  }, [items]);

  const next = active.find((a) => a.queue.waiting) || active[0];

  function row(a: Row) {
    const canAct = a.paid !== "PAID" && a.status !== "CANCELLED" && a.status !== "DONE" && a.status !== "NO_SHOW";
    return (
      <div key={a.id} className="space-y-3 rounded-2xl border border-white/5 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p>{a.service.name}</p>
            <p className="text-sm text-[#8b93a7]">
              {formatWhen(new Date(a.startsAt))} · {brl(a.service.priceCents)}
            </p>
            {a.queue.waiting && <p className="mt-1 text-sm text-cyan">{queueLabel(a.queue)}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{STATUS_LABEL[a.status] || a.status}</Badge>
            <Badge tone={a.paid === "PAID" ? "cyan" : "danger"}>{a.paid === "PAID" ? "Pago" : "A pagar"}</Badge>
            {canAct && (
              <Button variant="cyan" type="button" onClick={() => pay(a.id)}>
                Pagar agora
              </Button>
            )}
            {canAct && (
              <Button
                variant="danger"
                type="button"
                onClick={async () => {
                  if (!confirm("Excluir este horário?")) return;
                  const res = await fetch(`/api/portal/appointments/${a.id}`, { method: "DELETE" });
                  const data = await res.json();
                  if (!res.ok) setMsg(data.error);
                  else {
                    setCheckout(null);
                    load();
                  }
                }}
              >
                Excluir
              </Button>
            )}
            <Link href={shopPath(a.barber.slug)}>
              <Button variant="ghost" type="button">
                Agendar de novo
              </Button>
            </Link>
          </div>
        </div>
        {checkout?.appointmentId === a.id && (
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
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {next && (
        <Card>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Sua vez nesta unidade</p>
          <h2 className="mt-2 text-3xl">{next.queue.waiting ? queueLabel(next.queue) : "Próximo horário"}</h2>
          <p className="mt-2 text-[#8b93a7]">
            {next.service.name} · {formatWhen(new Date(next.startsAt))}
            {next.queue.waiting ? ` · você é o ${next.queue.position}º de ${next.queue.total}` : ""}
          </p>
        </Card>
      )}
      <Card>
        <h2 className="mb-4">Seus horários</h2>
        {msg && <p className="mb-3 text-sm text-[#ff5d73]">{msg}</p>}
        <div className="grid gap-3">
          {items.length === 0 && <p className="text-[#8b93a7]">Nenhum agendamento ainda.</p>}
          {active.length > 0 && (
            <div className="grid gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan">Ativos agora</p>
              {active.map(row)}
            </div>
          )}
          {items.length > 0 && active.length === 0 && (
            <p className="text-[#8b93a7]">Nenhum horário ativo. Os demais estão nas listas abaixo.</p>
          )}
          <Fold title="Cancelados" count={cancelled.length}>
            {cancelled.map(row)}
          </Fold>
          <Fold title="Concluídos" count={done.length}>
            {done.map(row)}
          </Fold>
        </div>
      </Card>
    </div>
  );
}
