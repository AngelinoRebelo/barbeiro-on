"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, OpNotice, inputClass } from "@/components/ui";
import { brandUrl } from "@/lib/brand";

type Notice = { ok: boolean; text: string };

function notice(ok: boolean, text: string): Notice {
  return { ok, text };
}

export default function ConfigPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    shopName: "",
    bio: "",
    address: "",
    city: "",
    openTime: "09:00",
    closeTime: "20:00",
    pixKey: "",
    pixKeyType: "RANDOM",
    mpPublicKey: "",
    mpAccessToken: "",
    slug: "",
  });
  const [brandAt, setBrandAt] = useState<string | null>(null);
  const [brandBusy, setBrandBusy] = useState(false);
  const [shopBusy, setShopBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [brandMsg, setBrandMsg] = useState<Notice>({ ok: true, text: "" });
  const [shopMsg, setShopMsg] = useState<Notice>({ ok: true, text: "" });
  const [payMsg, setPayMsg] = useState<Notice>({ ok: true, text: "" });

  useEffect(() => {
    fetch("/api/barber/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) return;
        const { brandAt: nextBrand, mpAccessToken, ...profile } = d.profile;
        setForm((prev) => ({ ...prev, ...profile, mpAccessToken: mpAccessToken || "" }));
        setBrandAt(nextBrand || null);
      });
  }, []);

  const preview = brandUrl(form.slug, brandAt);

  async function uploadBrand(file: File) {
    setBrandBusy(true);
    setBrandMsg(notice(true, ""));
    const body = new FormData();
    body.append("image", file);
    const res = await fetch("/api/barber/brand", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setBrandBusy(false);
    if (!res.ok) {
      setBrandMsg(notice(false, data.error || "Não foi possível enviar a imagem."));
      return;
    }
    setBrandAt(data.brandAt);
    setBrandMsg(notice(true, "Imagem salva."));
    router.refresh();
  }

  async function removeBrand() {
    setBrandBusy(true);
    setBrandMsg(notice(true, ""));
    const res = await fetch("/api/barber/brand", { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBrandBusy(false);
    if (!res.ok) {
      setBrandMsg(notice(false, data.error || "Não foi possível remover a imagem."));
      return;
    }
    setBrandAt(null);
    setBrandMsg(notice(true, "Imagem removida."));
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <h2 className="mb-2">Marca da unidade</h2>
        <p className="mb-4 text-sm text-[#8b93a7]">
          Envie uma foto ou logo. Ela aparece no cabeçalho e também como plano de fundo das páginas da sua barbearia.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[#10131c]">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Marca da unidade" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full place-items-center text-[10px] tracking-[0.2em] text-gold">ON</span>
            )}
          </div>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={brandBusy}
              className="block text-sm text-[#c6ccda] file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#07080c]"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadBrand(file);
              }}
            />
            <p className="text-xs text-[#8b93a7]">JPG, PNG ou WEBP · até 1,5 MB</p>
            {preview && (
              <Button type="button" variant="ghost" disabled={brandBusy} onClick={() => void removeBrand()}>
                Remover imagem
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <OpNotice ok={brandMsg.ok} text={brandMsg.text} />
        </div>
      </Card>
      <Card>
        <h2 className="mb-4">Unidade</h2>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setShopBusy(true);
            setShopMsg(notice(true, ""));
            const res = await fetch("/api/barber/settings", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));
            setShopBusy(false);
            setShopMsg(notice(res.ok, res.ok ? "Unidade salva." : data.error || "Não foi possível salvar a unidade."));
            if (res.ok) router.refresh();
          }}
        >
          <Field label="Nome da barbearia"><input className={inputClass()} value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} /></Field>
          <Field label="Nome do barbeiro"><input className={inputClass()} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Cidade"><input className={inputClass()} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Endereço"><input className={inputClass()} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Bio"><textarea className={inputClass()} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Abre"><input className={inputClass()} type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} /></Field>
            <Field label="Fecha"><input className={inputClass()} type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} /></Field>
          </div>
          <Button disabled={shopBusy}>{shopBusy ? "Salvando..." : "Salvar unidade"}</Button>
          <OpNotice ok={shopMsg.ok} text={shopMsg.text} />
        </form>
      </Card>
      <Card>
        <h2 className="mb-2">Recebimentos do contratante</h2>
        <p className="mb-4 text-sm text-[#8b93a7]">
          PIX e cartão passam pelo Mercado Pago cadastrado (Public Key + Access Token). A confirmação entra sozinha no sistema, na própria página. A chave PIX avulsa não é mais usada para cobrar o cliente.
        </p>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setPayBusy(true);
            setPayMsg(notice(true, ""));
            const res = await fetch("/api/barber/settings", {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                payments: {
                  pixKey: form.pixKey,
                  pixKeyType: form.pixKeyType,
                  mpPublicKey: form.mpPublicKey,
                  mpAccessToken: form.mpAccessToken,
                },
              }),
            });
            const data = await res.json().catch(() => ({}));
            setPayBusy(false);
            setPayMsg(notice(res.ok, res.ok ? "Pagamentos salvos." : data.error || "Não foi possível salvar os pagamentos."));
          }}
        >
          <Field label="Tipo da chave PIX">
            <select className={inputClass()} value={form.pixKeyType} onChange={(e) => setForm({ ...form, pixKeyType: e.target.value })}>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="PHONE">Telefone</option>
              <option value="RANDOM">Aleatória</option>
            </select>
          </Field>
          <Field label="Chave PIX"><input className={inputClass()} value={form.pixKey} onChange={(e) => setForm({ ...form, pixKey: e.target.value })} /></Field>
          <Field label="Mercado Pago Public Key"><input className={inputClass()} value={form.mpPublicKey} onChange={(e) => setForm({ ...form, mpPublicKey: e.target.value })} /></Field>
          <Field label="Mercado Pago Access Token"><input className={inputClass()} value={form.mpAccessToken} onChange={(e) => setForm({ ...form, mpAccessToken: e.target.value })} placeholder="APP_USR-..." /></Field>
          <Button variant="cyan" disabled={payBusy}>{payBusy ? "Salvando..." : "Salvar pagamentos"}</Button>
          <OpNotice ok={payMsg.ok} text={payMsg.text} />
        </form>
      </Card>
    </div>
  );
}
