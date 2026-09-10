import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Logo } from "@/components/ui";
import { LoginForm } from "@/components/auth-forms";
import { shopPath, isReservedSlug } from "@/lib/paths";

export default async function ShopLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isReservedSlug(slug)) notFound();
  const shop = await prisma.barberProfile.findUnique({ where: { slug } });
  if (!shop) notFound();

  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <Logo href={shopPath(slug)} />
        <h1 className="mt-6 text-2xl font-semibold">Entrar em {shop.shopName}</h1>
        <p className="mb-6 text-sm text-[#8b93a7]">Acesso da unidade /{slug}.</p>
        <Suspense>
          <LoginForm shopSlug={slug} />
        </Suspense>
        <p className="mt-6 text-sm text-[#8b93a7]">
          Cliente novo? <Link className="text-gold" href={shopPath(slug, "/cadastro")}>Criar conta aqui</Link>
        </p>
      </Card>
    </div>
  );
}
