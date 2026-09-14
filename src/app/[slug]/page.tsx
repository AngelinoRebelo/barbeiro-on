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
      <header className="relative z-10 mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <ShopLogo slug={slug} shopName={shop.shopName} brandAt={shop.brandAt} href={shopPath(slug)} />
        <nav className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
          {clientHere ? (
            <>
              <p className="col-span-2 truncate text-sm text-[#8b93a7] sm:col-span-1 sm:max-w-[10rem]">Olá, {session.name}</p>
              <Link href={shopPath(slug, "/portal")} className="min-w-0">
                <Button variant="ghost" className="w-full px-3 sm:w-auto sm:px-5">
                  Minha área
                </Button>
              </Link>
              <Link href={shopPath(slug, "/portal/agenda")} className="min-w-0">
                <Button className="w-full px-3 sm:w-auto sm:px-5">Meus horários</Button>
              </Link>
              <div className="col-span-2 sm:col-span-1">
                <LogoutButton className="w-full sm:w-auto" href={shopPath(slug)} />
              </div>
            </>
          ) : barberHere ? (
            <>
              <Link href={shopPath(slug, "/painel")} className="min-w-0">
                <Button className="w-full px-3 sm:w-auto sm:px-5">Painel</Button>
              </Link>
              <LogoutButton className="w-full sm:w-auto" href={shopPath(slug, "/login")} />
            </>
          ) : (
            <>
              <Link href={`${shopPath(slug, "/login")}?next=${encodeURIComponent(shopPath(slug))}`} className="min-w-0">
                <Button variant="ghost" className="w-full whitespace-nowrap px-3 sm:w-auto sm:px-5">
                  Entrar
                </Button>
              </Link>
              <Link href={shopPath(slug, "/cadastro")} className="min-w-0">
                <Button className="w-full whitespace-nowrap px-3 text-center sm:w-auto sm:px-5">
                  <span className="sm:hidden">Criar conta</span>
                  <span className="hidden sm:inline">Criar conta nesta barbearia</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
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

