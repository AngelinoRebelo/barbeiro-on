"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import { brl, CATEGORY_LABEL, ymd } from "@/lib/utils";
import { queueLabel, type QueueInfo } from "@/lib/queue-view";
import { MpCheckout } from "@/components/mp-checkout-lazy";

type Shop = {
  shopName: string;
  bio: string;
  address: string;
  city: string;
  barberName: string;
  pix: boolean;
  mercadopago: boolean;
  live?: boolean;
  approved?: boolean;
  services: { id: string; name: string; category: string; durationMin: number; priceCents: number }[];
};

export function ShopBooker({ slug, initialQr, loggedIn = false }: { slug: string; initialQr: string; loggedIn?: boolean }) {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(ymd(new Date()));
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState("");
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [checkout, setCheckout] = useState<{
    paymentId: string;
    publicKey: string;
    amountCents: number;
    payerEmail: string;
    preferenceId: string;
  } | null>(null);

  const canPay = Boolean(shop?.pix || shop?.mercadopago);

  async function load(sid = serviceId, d = date) {
    const res = await fetch(`/api/shop/${slug}?date=${d}&serviceId=${sid}`);
    const data = await res.json();
    if (!res.ok) return setMsg(data.error);
    setShop(data.shop);
    setSlots(data.slots || []);
    if (!sid && data.shop.services[0]) setServiceId(data.shop.services[0].id);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (serviceId) load(serviceId, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date]);

  async function book(payNow: boolean) {
    setMsg("");
    const res = await fetch(`/api/shop/${slug}/book`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId, date, time }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) return router.push(`/${slug}/login?next=${encodeURIComponent(`/${slug}`)}`);
      return setMsg(data.error);
    }
    setQueue(data.queue || null);
    if (!payNow || !canPay) {
      setMsg("Horário reservado. Acompanhe a fila na sua área.");
      router.push(`/${slug}/portal/agenda`);
      return;
    }
    const pay = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appointmentId: data.appointment.id }),
    });
    const pdata = await pay.json();
    if (!pay.ok) return setMsg(pdata.error);
    setCheckout({
      paymentId: pdata.paymentId,
      publicKey: pdata.publicKey,
      amountCents: pdata.amountCents,
      payerEmail: pdata.payerEmail,
      preferenceId: pdata.preferenceId,
    });
    setMsg("Horário reservado. Pague abaixo para confirmar.");
  }

  if (!shop) return <p className="text-[#8b93a7]">{msg || "Carregando unidade..."}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_320px]">
      <Card>
        <p className="text-xs uppercase tracking-[0.28em] text-gold">{shop.city}</p>
        <h1 className="mt-2 text-4xl">{shop.shopName}</h1>
        <p className="mt-2 text-[#8b93a7]">{shop.barberName} · {shop.address}</p>
        <p className="mt-4">{shop.bio}</p>
        <div className="mt-6 grid gap-2">
          {shop.services.map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={`rounded-2xl border px-4 py-3 text-left ${serviceId === s.id ? "border-gold" : "border-white/10"}`}
            >
              <div className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-cyan">{brl(s.priceCents)}</span>
              </div>
              <p className="text-sm text-[#8b93a7]">{CATEGORY_LABEL[s.category]} · {s.durationMin} min</p>
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <input className={inputClass()} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            {slots.length === 0 && <p className="text-sm text-[#8b93a7]">Sem horários livres neste dia. O barbeiro libera os horários na agenda.</p>}
            {slots.map((t) => (
              <button key={t} onClick={() => setTime(t)} className={`rounded-full border px-3 py-1 text-sm ${time === t ? "border-gold text-gold" : "border-white/10"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {queue && (
          <div className="mt-4 rounded-2xl border border-cyan/30 px-4 py-3">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan">Sua vez</p>
            <p className="mt-1 text-lg">{queueLabel(queue)}</p>
            <p className="text-sm text-[#8b93a7]">Você é o {queue.position}º de {queue.total} neste dia.</p>
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-cyan">{msg}</p>}
        {!checkout && (
          <div className="mt-6 flex flex-wrap gap-2">
            {shop.live === false ? (
              <p className="text-sm text-gold">Agenda libera quando o admin aprovar a unidade. Crie sua conta nesta barbearia pelo botão acima.</p>
            ) : (
              <>
                {canPay && (
              <Button onClick={() => book(true)} disabled={!time}>
                {loggedIn ? "Confirmar e pagar" : "Entrar, confirmar e pagar"}
              </Button>
                )}
                <Button variant="ghost" onClick={() => book(false)} disabled={!time}>
                  Só reservar
                </Button>
              </>
            )}
          </div>
        )}
        {checkout && (
          <div className="mt-6 border-t border-white/5 pt-4">
            <MpCheckout
              paymentId={checkout.paymentId}
              publicKey={checkout.publicKey}
              amountCents={checkout.amountCents}
              payerEmail={checkout.payerEmail}
              preferenceId={checkout.preferenceId}
              onPaid={() => {
                setMsg("Pagamento confirmado. Acompanhe a fila no portal.");
                router.push(`/${slug}/portal/agenda`);
              }}
            />
          </div>
        )}
      </Card>
      <Card>
        <h2>Entrada da sessão</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">QR da vitrine desta unidade.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={initialQr} alt="QR da unidade" className="mt-4 w-full rounded-2xl" />
        <div className="mt-3 flex gap-2">
          <Badge tone="cyan">{shop.pix ? "PIX MP" : "PIX off"}</Badge>
          <Badge>{shop.mercadopago ? "Cartão MP" : "Cartão off"}</Badge>
        </div>
      </Card>
    </div>
  );
}
