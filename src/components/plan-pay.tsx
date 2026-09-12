"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { brl } from "@/lib/utils";
import { MpCheckout } from "@/components/mp-checkout-lazy";

export function PlanPay({
  planName,
  priceCents,
  interval,
  durationDays,
}: {
  planName: string;
  priceCents: number;
  interval: string;
  durationDays?: number;
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

  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Plano selecionado</p>
      <h2 className="mt-2 text-3xl">{planName}</h2>
      <p className="mt-2 text-cyan">
        {brl(priceCents)} / {interval === "YEARLY" ? "ano" : "mês"}
        {durationDays ? ` · ${durationDays} dias de vigência` : ""}
      </p>
      <p className="mt-4 text-sm text-[#8b93a7]">
        PIX e cartão usam o Mercado Pago da plataforma. A confirmação entra sozinha no sistema.
      </p>
      {msg && <p className="mt-3 text-sm text-[#ff5d73]">{msg}</p>}
      {!checkout && (
        <div className="mt-6">
          <Button variant="cyan" onClick={pay}>Pagar com Mercado Pago</Button>
        </div>
      )}
      {checkout && (
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
