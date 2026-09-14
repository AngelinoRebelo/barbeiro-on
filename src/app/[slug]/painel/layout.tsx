import { clearSessionCookie, getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { parseFeatures } from "@/lib/features";
import { shopPath } from "@/lib/paths";
import { daysLeft, isOnTrial } from "@/lib/access";
import { getPlatformSettings } from "@/lib/platform";
import { lastPaidSubscription } from "@/lib/subscription";
import { TrialNoticeLive } from "@/components/trial-notice";

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
  if (!user || user.role !== "BARBER" || !user.barberProfile) {
    await clearSessionCookie();
    redirect(`/${slug}/login`);
  }
  if (user.barberProfile.slug !== slug) redirect(shopPath(user.barberProfile.slug, "/painel"));
  const features = parseFeatures(user.barberProfile.features);
  const base = shopPath(slug, "/painel");
  const [platform, lastPaid] = await Promise.all([
    getPlatformSettings(),
    lastPaidSubscription(user.barberProfile.id),
  ]);
  const trial = isOnTrial(user.barberProfile.trialUntil) && !lastPaid;

  const nav = [
    { href: base, label: "Painel", show: true },
    { href: `${base}/agenda`, label: "Agenda", show: features.agenda },
    { href: `${base}/clientes`, label: "Clientes", show: features.clients },
    { href: `${base}/servicos`, label: "Serviços", show: features.services },
    { href: `${base}/financeiro`, label: "Financeiro", show: features.pix || features.mercadopago },
    { href: `${base}/configuracoes`, label: "Configurações", show: true },
    { href: `${base}/plano`, label: "Plano", show: true },
    { href: `${base}/suporte`, label: "Suporte", show: true },
  ]
    .filter((i) => i.show)
    .map((i) => ({ href: i.href, label: i.label }));

  return (
    <AppShell
      title={user.barberProfile.shopName}
      subtitle={`/${slug}`}
      nav={nav}
      homeHref={shopPath(slug)}
      logoutHref={shopPath(slug, "/login")}
      brandSlug={slug}
      brandAt={user.barberProfile.brandAt}
      shopName={user.barberProfile.shopName}
    >
      <TrialNoticeLive
        initialOnTrial={trial}
        initialDaysLeft={daysLeft(user.barberProfile.trialUntil)}
        initialConfiguredDays={platform.trialDays}
      />
      {children}
    </AppShell>
  );
}
