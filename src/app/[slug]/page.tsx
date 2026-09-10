import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { qrDataUrl } from "@/lib/qr";
import { Logo, Button } from "@/components/ui";
import { ShopBooker } from "@/components/shop-booker";
import { shopPath, shopUrl, isReservedSlug } from "@/lib/paths";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    include: { user: true },
  });
  if (!shop) notFound();
  const qr = await qrDataUrl(shopUrl(slug));

  return (
    <div className="grid-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo href={shopPath(slug)} />
        <div className="flex gap-3">
          <Link href={shopPath(slug, "/login")}>
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href={shopPath(slug, "/cadastro")}>
            <Button>Criar conta nesta barbearia</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        {!shop.approved && (
          <p className="mb-6 rounded-2xl border border-gold/30 px-4 py-3 text-sm text-gold">
            Unidade recém-criada. Cadastro de clientes já abre aqui; a agenda libera após o admin aprovar.
          </p>
        )}
        <ShopBooker slug={slug} initialQr={qr} />
      </main>
    </div>
  );
}
