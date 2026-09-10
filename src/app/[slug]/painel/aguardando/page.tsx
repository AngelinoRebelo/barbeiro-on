import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { shopPath, shopUrl } from "@/lib/paths";
import { qrDataUrl } from "@/lib/qr";
import Link from "next/link";

export default async function AguardandoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireUser();
  const url = shopUrl(slug);
  const qr = await qrDataUrl(url);
  return (
    <Card>
      <h2 className="text-2xl">Unidade em análise</h2>
      <p className="mt-3 max-w-xl text-[#8b93a7]">
        {user.name}, o diretório <b>{shopPath(slug)}</b> já existe. O admin precisa aprovar a unidade para liberar agenda e caixa. Você já pode compartilhar o link com clientes.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt="QR da unidade" className="mt-6 w-40 rounded-2xl" />
      <p className="mt-3 font-mono text-xs break-all text-gold">{url}</p>
      <Link className="mt-4 inline-block text-sm text-cyan" href={shopPath(slug)}>
        Abrir página da barbearia
      </Link>
    </Card>
  );
}
