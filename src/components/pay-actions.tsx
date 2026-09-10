"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function PayActions({
  id,
  method,
  status,
  initPoint,
  canConfirm,
}: {
  id: string;
  method: string;
  status: string;
  initPoint: string | null;
  canConfirm: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  if (status === "PAID") return <p className="mt-6 text-cyan">Pagamento confirmado.</p>;

  return (
    <div className="mt-6 space-y-3">
      {method === "MERCADOPAGO" && initPoint && (
        <a href={initPoint}>
          <Button className="w-full" variant="cyan">Pagar com Mercado Pago</Button>
        </a>
      )}
      {method === "PIX" && canConfirm && (
        <Button
          className="w-full"
          onClick={async () => {
            const res = await fetch("/api/payments/create", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id, action: "confirm" }),
            });
            const data = await res.json();
            if (!res.ok) setMsg(data.error);
            else router.refresh();
          }}
        >
          Confirmar PIX recebido
        </Button>
      )}
      {msg && <p className="text-sm text-[#ff5d73]">{msg}</p>}
    </div>
  );
}
