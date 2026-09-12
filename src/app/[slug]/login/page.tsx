import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { LoginForm } from "@/components/auth-forms";
import { shopPath, isReservedSlug } from "@/lib/paths";
import { ShopBackdrop, ShopLogo } from "@/components/shop-brand";

export default async function ShopLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const shop = await prisma.barberProfile.findUnique({ where: { slug } });
  if (!shop) notFound();

  return (
    <ShopBackdrop slug={slug} brandAt={shop.brandAt} contentClassName="grid place-items-center px-4">
      <Card className="w-full max-w-md">
        <ShopLogo slug={slug} shopName={shop.shopName} brandAt={shop.brandAt} href={shopPath(slug)} />
        <h1 className="mt-6 text-2xl font-semibold">Entrar em {shop.shopName}</h1>
        <p className="mb-6 text-sm text-[#8b93a7]">Acesso da unidade /{slug}.</p>
        <Suspense>
          <LoginForm shopSlug={slug} />
        </Suspense>
        <p className="mt-6 text-sm text-[#8b93a7]">
          Cliente novo? <Link className="text-gold" href={shopPath(slug, "/cadastro")}>Criar conta aqui</Link>
        </p>
      </Card>
    </ShopBackdrop>
  );
}
