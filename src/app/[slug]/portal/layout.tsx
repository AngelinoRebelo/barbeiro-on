import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell";
import { shopPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await requireClient(slug);
  const shop = await prisma.barberProfile.findUnique({
    where: { slug },
    select: { shopName: true, brandAt: true },
  });
  const nav = [
    { href: shopPath(slug, "/portal"), label: "Início" },
    { href: shopPath(slug, "/portal/agenda"), label: "Meus horários" },
    { href: shopPath(slug), label: "Agendar" },
    { href: shopPath(slug, "/portal/suporte"), label: "Suporte" },
  ];
  return (
    <AppShell
      title="Área do cliente"
      subtitle={`/${slug}`}
      nav={nav}
      homeHref={shopPath(slug)}
      logoutHref={shopPath(slug)}
      brandSlug={slug}
      brandAt={shop?.brandAt}
      shopName={shop?.shopName}
    >
      {children}
    </AppShell>
  );
}
