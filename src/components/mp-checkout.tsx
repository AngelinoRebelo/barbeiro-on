"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import { brl } from "@/lib/utils";

type Props = {
  paymentId: string;
  publicKey: string;
  amountCents: number;
  payerEmail?: string;
  preferenceId?: string;
  onPaid?: () => void;
};

export function MpCheckout({ paymentId, publicKey, amountCents, payerEmail, preferenceId, onPaid }: Props) {
  const [ready, setReady] = useState(false);
  const [mpPaymentId, setMpPaymentId] = useState("");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!publicKey) return;
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setReady(true);
  }, [publicKey]);

  useEffect(() => {
    if (paid) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/payments/${paymentId}`);
      const data = await res.json().catch(() => ({}));
      if (data.status === "PAID") {
        setPaid(true);
        onPaid?.();
      } else if (data.mpPaymentId) {
        setMpPaymentId((current) => current || data.mpPaymentId);
      }
    }, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentId, paid]);

  const methods = {
    creditCard: "all" as const,
    debitCard: "all" as const,
    bankTransfer: ["pix"],
    maxInstallments: 12,
    ...(preferenceId ? { mercadoPago: "all" as const } : {}),
  };

  if (!publicKey) {
    return <p className="text-sm text-[#ff5d73]">Mercado Pago sem Public Key. Cadastre em PIX e Mercado Pago.</p>;
  }
  if (!ready) return <p className="text-sm text-[#8b93a7]">Carregando Mercado Pago...</p>;
  if (paid) return <p className="text-cyan">Pagamento confirmado automaticamente.</p>;

  if (mpPaymentId) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white p-2">
        <StatusScreen
          id={`status_${paymentId}`}
          initialization={{ paymentId: mpPaymentId }}
          locale="pt-BR"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#8b93a7]">
        Pague {brl(amountCents)} aqui mesmo, no PIX ou cartão do Mercado Pago. A confirmação entra sozinha no sistema.
      </p>
      {error && <p className="text-sm text-[#ff5d73]">{error}</p>}
      <div className="overflow-hidden rounded-2xl bg-white p-2">
        <Payment
          id={`payment_${paymentId}`}
          locale="pt-BR"
          initialization={{
            amount: Number((amountCents / 100).toFixed(2)),
            preferenceId: preferenceId || undefined,
            payer: payerEmail ? { email: payerEmail } : undefined,
          }}
          customization={{
            paymentMethods: methods,
            visual: { style: { theme: "default" } },
          }}
          onSubmit={async ({ formData }) => {
            setError("");
            const res = await fetch(`/api/payments/${paymentId}/process`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ formData }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error || "Não foi possível processar o pagamento.");
              throw new Error(data.error || "Falha no pagamento");
            }
            if (data.status === "approved") {
              setPaid(true);
              onPaid?.();
            } else if (data.id) {
              setMpPaymentId(String(data.id));
            }
            return data;
          }}
          onError={() => setError("O Mercado Pago não conseguiu abrir o checkout.")}
        />
      </div>
    </div>
  );
}
