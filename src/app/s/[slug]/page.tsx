import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseFeatures } from "@/lib/features";
import { qrDataUrl } from "@/lib/qr";
import { appUrl } from "@/lib/utils";
import { Logo } from "@/components/ui";
import { ShopBooker } from "@/components/shop-booker";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    include: { user: true },
  });
  if (!shop?.approved || shop.user.status !== "ACTIVE") notFound();
  if (!parseFeatures(shop.features).publicShop) notFound();
  const qr = await qrDataUrl(`${appUrl()}/s/${slug}`);

  return (
    <div className="grid-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-20">
        <ShopBooker slug={slug} initialQr={qr} />
      </main>
    </div>
  );
}
