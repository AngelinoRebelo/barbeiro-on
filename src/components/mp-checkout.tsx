"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export const MpCheckout = memo(function MpCheckout({
  paymentId,
  publicKey,
  amountCents,
  payerEmail,
  preferenceId,
  onPaid,
}: Props) {
  const [ready, setReady] = useState(false);
  const [mpPaymentId, setMpPaymentId] = useState("");
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    if (!publicKey) return;
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setReady(true);
  }, [publicKey]);

  useEffect(() => {
    if (paid) return;
    let cancelled = false;
    async function checkPaid() {
      const res = await fetch(`/api/payments/${paymentId}`);
      const data = await res.json().catch(() => ({}));
      if (cancelled || data.status !== "PAID") return;
      setPaid(true);
      onPaidRef.current?.();
    }
    void checkPaid();
    const timer = setInterval(checkPaid, 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [paymentId, paid]);

  const initialization = useMemo(
    () => ({
      amount: Number((amountCents / 100).toFixed(2)),
      preferenceId: preferenceId || undefined,
      payer: payerEmail ? { email: payerEmail } : undefined,
    }),
    [amountCents, preferenceId, payerEmail],
  );

  const customization = useMemo(
    () => ({
      paymentMethods: {
        creditCard: "all" as const,
        debitCard: "all" as const,
        bankTransfer: ["pix"],
        maxInstallments: 12,
        ...(preferenceId ? { mercadoPago: "all" as const } : {}),
      },
      visual: { style: { theme: "default" as const } },
    }),
    [preferenceId],
  );

  const statusInitialization = useMemo(
    () => ({ paymentId: mpPaymentId }),
    [mpPaymentId],
  );

  const onSubmit = useCallback(async ({ formData }: { formData: unknown }) => {
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
      onPaidRef.current?.();
    } else if (data.id) {
      setMpPaymentId(String(data.id));
    }
    return data;
  }, [paymentId]);

  const onError = useCallback(() => {
    setError("O Mercado Pago não conseguiu abrir o checkout.");
  }, []);

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
          initialization={statusInitialization}
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
          initialization={initialization}
          customization={customization}
          onSubmit={onSubmit}
          onError={onError}
        />
      </div>
    </div>
  );
});
