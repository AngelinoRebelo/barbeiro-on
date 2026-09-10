import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { parseFeatures } from "@/lib/features";
import { shopPath } from "@/lib/paths";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect(`/${slug}/login`);
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { barberProfile: true },
  });
  if (!user || user.role !== "BARBER" || !user.barberProfile) redirect("/login");
  if (user.barberProfile.slug !== slug) redirect(shopPath(user.barberProfile.slug, "/painel"));
  const features = parseFeatures(user.barberProfile.features);
  const base = shopPath(slug, "/painel");

  const nav = [
    { href: base, label: "Painel", show: true },
    { href: `${base}/agenda`, label: "Agenda", show: features.agenda },
    { href: `${base}/clientes`, label: "Clientes", show: features.clients },
    { href: `${base}/servicos`, label: "Serviços", show: features.services },
    { href: `${base}/financeiro`, label: "Financeiro", show: features.pix || features.mercadopago },
    { href: `${base}/configuracoes`, label: "PIX e Mercado Pago", show: true },
    { href: `${base}/plano`, label: "Plano", show: true },
  ]
    .filter((i) => i.show)
    .map((i) => ({ href: i.href, label: i.label }));

  return (
    <AppShell title={user.barberProfile.shopName} subtitle={`/${slug}`} nav={nav} homeHref={shopPath(slug)}>
      {children}
    </AppShell>
  );
}
