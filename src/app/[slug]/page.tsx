import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { qrDataUrl } from "@/lib/qr";
import { Button } from "@/components/ui";
import { ShopBooker } from "@/components/shop-booker";
import { shopPath, shopUrl, isReservedSlug } from "@/lib/paths";
import { getSession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";
import { ShopAtmosphere } from "@/components/shop-atmosphere";
import { ShopBackdrop, ShopLogo } from "@/components/shop-brand";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    include: { user: true },
  });
  if (!shop) notFound();
  const qr = await qrDataUrl(shopUrl(slug));
  const session = await getSession();
  const here = session?.slug === slug;
  const clientHere = here && session?.role === "CLIENT";
  const barberHere = here && session?.role === "BARBER";

  return (
    <ShopBackdrop slug={slug} brandAt={shop.brandAt}>
      {!shop.brandAt && <ShopAtmosphere />}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <ShopLogo slug={slug} shopName={shop.shopName} brandAt={shop.brandAt} href={shopPath(slug)} />
        <div className="flex flex-wrap items-center gap-3">
          {clientHere ? (
            <>
              <span className="text-sm text-[#8b93a7]">Olá, {session.name}</span>
              <Link href={shopPath(slug, "/portal")}>
                <Button variant="ghost">Minha área</Button>
              </Link>
              <Link href={shopPath(slug, "/portal/agenda")}>
                <Button>Meus horários</Button>
              </Link>
              <LogoutButton href={shopPath(slug)} />
            </>
          ) : barberHere ? (
            <>
              <Link href={shopPath(slug, "/painel")}>
                <Button>Painel</Button>
              </Link>
              <LogoutButton href={shopPath(slug, "/login")} />
            </>
          ) : (
            <>
              <Link href={`${shopPath(slug, "/login")}?next=${encodeURIComponent(shopPath(slug))}`}>
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link href={shopPath(slug, "/cadastro")}>
                <Button>Criar conta nesta barbearia</Button>
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        {!shop.approved && (
          <p className="mb-6 rounded-2xl border border-gold/30 px-4 py-3 text-sm text-gold">
            Unidade recém-criada. Cadastro de clientes já abre aqui; a agenda libera após o admin aprovar.
          </p>
        )}
        {clientHere && (
          <p className="mb-6 rounded-2xl border border-cyan/30 px-4 py-3 text-sm text-cyan">
            Você está logado nesta barbearia. Escolha o serviço e o horário disponível.
          </p>
        )}
        <ShopBooker slug={slug} initialQr={qr} loggedIn={Boolean(clientHere)} />
      </main>
    </ShopBackdrop>
  );
}

