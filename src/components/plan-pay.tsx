"use client";

import { useState } from "react";
import { Button, Card } from "@/components/ui";
import { brl } from "@/lib/utils";

export function PlanPay({
  planName,
  priceCents,
  interval,
}: {
  planName: string;
  priceCents: number;
  interval: string;
}) {
  const [msg, setMsg] = useState("");
  async function pay(method: "PIX" | "MERCADOPAGO") {
    setMsg("");
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "SUBSCRIPTION", method }),
    });
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    if (data.initPoint) window.location.href = data.initPoint;
    else window.location.href = data.redirect;
  }
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Plano selecionado</p>
      <h2 className="mt-2 text-3xl">{planName}</h2>
      <p className="mt-2 text-cyan">
        {brl(priceCents)} / {interval === "YEARLY" ? "ano" : "mês"}
      </p>
      <p className="mt-4 text-sm text-[#8b93a7]">
        O valor é definido pelo admin e cai na PIX/Mercado Pago da plataforma. Seus PIX e MP da unidade recebem os cortes e barbas.
      </p>
      {msg && <p className="mt-3 text-sm text-[#ff5d73]">{msg}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => pay("PIX")}>Pagar PIX da plataforma</Button>
        <Button variant="cyan" onClick={() => pay("MERCADOPAGO")}>Pagar no Mercado Pago</Button>
      </div>
    </Card>
  );
}
