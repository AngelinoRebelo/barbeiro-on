"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { brl, formatDay, formatWhen } from "@/lib/utils";
import { MpCheckout } from "@/components/mp-checkout-lazy";

export type LastPlanPayment = {
  amountCents: number;
  paidAt: string | null;
  createdAt: string;
  method: string;
};

export function PlanPay({
  planName,
  priceCents,
  interval,
  durationDays,
  canPay,
  renewFrom,
  lastPayment,
}: {
  planName: string;
  priceCents: number;
  interval: string;
  durationDays?: number;
  canPay: boolean;
  renewFrom?: string | null;
  lastPayment?: LastPlanPayment | null;
}) {
  const [msg, setMsg] = useState("");
  const [checkout, setCheckout] = useState<{
    paymentId: string;
    publicKey: string;
    amountCents: number;
    payerEmail: string;
    preferenceId: string;
  } | null>(null);

  async function pay() {
    if (!canPay) return;
    setMsg("");
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "SUBSCRIPTION" }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    if (data.redirect && !data.embed) {
      window.location.href = data.redirect;
      return;
    }
    setCheckout({
      paymentId: data.paymentId,
      publicKey: data.publicKey,
      amountCents: data.amountCents,
      payerEmail: data.payerEmail,
      preferenceId: data.preferenceId,
    });
  }

  const lastWhen = lastPayment
    ? formatWhen(new Date(lastPayment.paidAt || lastPayment.createdAt))
    : null;

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Plano selecionado</p>
      <h2 className="mt-2 text-3xl">{planName}</h2>
      <p className="mt-2 text-cyan">
        {brl(priceCents)} / {interval === "YEARLY" ? "ano" : "mês"}
        {durationDays ? ` · ${durationDays} dias de vigência` : ""}
      </p>
      {lastPayment && lastWhen && (
        <p className="mt-4 rounded-2xl border border-cyan/25 bg-cyan/5 px-4 py-3 text-sm text-cyan">
          Último pagamento: {brl(lastPayment.amountCents)} em {lastWhen}
          {lastPayment.method === "PIX" ? " · PIX" : " · Mercado Pago"}.
        </p>
      )}
      {!lastPayment && (
        <p className="mt-4 text-sm text-[#8b93a7]">Nenhum pagamento de plano registrado ainda.</p>
      )}
      {canPay ? (
        <p className="mt-4 text-sm text-[#8b93a7]">
          PIX e cartão usam o Mercado Pago da plataforma. A confirmação entra sozinha no sistema.
        </p>
      ) : (
        <p className="mt-4 text-sm text-[#8b93a7]">
          O plano está ativo. Uma nova cobrança só abre 10 dias antes do término
          {renewFrom ? `, a partir de ${formatDay(new Date(renewFrom))}` : ""}.
        </p>
      )}
      {msg && <p className="mt-3 text-sm text-[#ff5d73]">{msg}</p>}
      {canPay && !checkout && (
        <div className="mt-6">
          <Button variant="cyan" onClick={pay}>Pagar com Mercado Pago</Button>
        </div>
      )}
      {canPay && checkout && (
        <div className="mt-6">
          <MpCheckout
            paymentId={checkout.paymentId}
            publicKey={checkout.publicKey}
            amountCents={checkout.amountCents}
            payerEmail={checkout.payerEmail}
            preferenceId={checkout.preferenceId}
          />
        </div>
      )}
    </Card>
  );
}
