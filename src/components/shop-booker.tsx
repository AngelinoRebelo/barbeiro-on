"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, inputClass } from "@/components/ui";
import { brl, CATEGORY_LABEL, ymd } from "@/lib/utils";

type Shop = {
  shopName: string;
  bio: string;
  address: string;
  city: string;
  barberName: string;
  pix: boolean;
  mercadopago: boolean;
  services: { id: string; name: string; category: string; durationMin: number; priceCents: number }[];
};

export function ShopBooker({ slug, initialQr }: { slug: string; initialQr: string }) {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(ymd(new Date()));
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [msg, setMsg] = useState("");

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

  async function book(method?: "PIX" | "MERCADOPAGO") {
    setMsg("");
    const res = await fetch(`/api/shop/${slug}/book`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId, date, time }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) return router.push("/login");
      return setMsg(data.error);
    }
    if (!method) {
      setMsg("Horário reservado.");
      router.push("/portal/agenda");
      return;
    }
    const pay = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appointmentId: data.appointment.id, method }),
    });
    const pdata = await pay.json();
    if (!pay.ok) return setMsg(pdata.error);
    if (pdata.initPoint) window.location.href = pdata.initPoint;
    else router.push(pdata.redirect);
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
            {slots.length === 0 && <p className="text-sm text-[#8b93a7]">Sem horários neste dia.</p>}
            {slots.map((t) => (
              <button key={t} onClick={() => setTime(t)} className={`rounded-full border px-3 py-1 text-sm ${time === t ? "border-gold text-gold" : "border-white/10"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        {msg && <p className="mt-3 text-sm text-cyan">{msg}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => book()} disabled={!time}>Reservar</Button>
          {shop.pix && <Button variant="ghost" onClick={() => book("PIX")} disabled={!time}>Reservar + PIX</Button>}
          {shop.mercadopago && <Button variant="cyan" onClick={() => book("MERCADOPAGO")} disabled={!time}>Reservar + cartão</Button>}
        </div>
      </Card>
      <Card>
        <h2>Entrada da sessão</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">QR da vitrine desta unidade.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={initialQr} alt="QR da unidade" className="mt-4 w-full rounded-2xl" />
        <div className="mt-3 flex gap-2">
          <Badge tone="cyan">{shop.pix ? "PIX on" : "PIX off"}</Badge>
          <Badge>{shop.mercadopago ? "MP on" : "MP off"}</Badge>
        </div>
      </Card>
    </div>
  );
}
