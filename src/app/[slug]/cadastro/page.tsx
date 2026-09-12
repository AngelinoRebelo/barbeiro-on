import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { ClientRegisterForm } from "@/components/auth-forms";
import { shopPath, isReservedSlug } from "@/lib/paths";
import { ShopBackdrop, ShopLogo } from "@/components/shop-brand";

export default async function ShopCadastroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const shop = await prisma.barberProfile.findUnique({ where: { slug } });
  if (!shop) notFound();

  return (
    <ShopBackdrop slug={slug} brandAt={shop.brandAt} contentClassName="grid place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <ShopLogo slug={slug} shopName={shop.shopName} brandAt={shop.brandAt} href={shopPath(slug)} />
        <h1 className="mt-6 text-2xl font-semibold">Cliente de {shop.shopName}</h1>
        <p className="mb-6 text-sm text-[#8b93a7]">Sua conta fica nesta barbearia: {shopPath(slug)}.</p>
        <ClientRegisterForm shopSlug={slug} shopName={shop.shopName} />
        <p className="mt-6 text-sm text-[#8b93a7]">
          Já tem conta? <Link className="text-gold" href={shopPath(slug, "/login")}>Entrar</Link>
        </p>
      </Card>
    </ShopBackdrop>
  );
}
