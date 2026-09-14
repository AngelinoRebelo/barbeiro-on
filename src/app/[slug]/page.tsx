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
      <header className="relative z-10 mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
          <ShopLogo
            slug={slug}
            shopName={shop.shopName}
            brandAt={shop.brandAt}
            href={shopPath(slug)}
            className="w-full min-w-0 md:w-auto md:max-w-[min(100%,22rem)]"
          />
          <nav className="flex w-full min-w-0 flex-col gap-2 min-[400px]:flex-row min-[400px]:items-stretch md:w-auto md:flex-wrap md:items-center md:justify-end md:gap-3">
            {clientHere ? (
              <>
                <p className="min-w-0 truncate text-center text-sm text-[#8b93a7] min-[400px]:hidden md:block md:max-w-[10rem] md:text-left">
                  Olá, {session.name}
                </p>
                <Link href={shopPath(slug, "/portal")} className="min-w-0 min-[400px]:flex-1 md:flex-none">
                  <Button variant="ghost" className="h-11 w-full px-4 md:h-auto md:w-auto md:px-5">
                    Minha área
                  </Button>
                </Link>
                <Link href={shopPath(slug, "/portal/agenda")} className="min-w-0 min-[400px]:flex-1 md:flex-none">
                  <Button className="h-11 w-full px-4 md:h-auto md:w-auto md:px-5">Meus horários</Button>
                </Link>
                <LogoutButton className="h-11 w-full md:h-auto md:w-auto" href={shopPath(slug)} />
              </>
            ) : barberHere ? (
              <>
                <Link href={shopPath(slug, "/painel")} className="min-w-0 min-[400px]:flex-1 md:flex-none">
                  <Button className="h-11 w-full px-4 md:h-auto md:w-auto md:px-5">Painel</Button>
                </Link>
                <LogoutButton className="h-11 w-full min-[400px]:flex-1 md:h-auto md:w-auto" href={shopPath(slug, "/login")} />
              </>
            ) : (
              <>
                <Link
                  href={`${shopPath(slug, "/login")}?next=${encodeURIComponent(shopPath(slug))}`}
                  className="min-w-0 min-[400px]:flex-1 md:flex-none"
                >
                  <Button variant="ghost" className="h-11 w-full whitespace-nowrap px-4 md:h-auto md:w-auto md:px-5">
                    Entrar
                  </Button>
                </Link>
                <Link href={shopPath(slug, "/cadastro")} className="min-w-0 min-[400px]:flex-1 md:flex-none">
                  <Button className="h-11 w-full whitespace-nowrap px-4 text-center md:h-auto md:w-auto md:px-5">
                    <span className="md:hidden">Criar conta</span>
                    <span className="hidden md:inline">Criar conta nesta barbearia</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-20 sm:px-6">
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

