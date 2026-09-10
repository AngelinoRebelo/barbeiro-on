import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { parseFeatures } from "@/lib/features";

export const dynamic = "force-dynamic";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { barberProfile: true },
  });
  if (!user || user.role !== "BARBER" || !user.barberProfile) redirect("/login");
  const features = parseFeatures(user.barberProfile.features);

  const nav = [
    { href: "/painel", label: "Painel", show: true },
    { href: "/painel/agenda", label: "Agenda", show: features.agenda },
    { href: "/painel/clientes", label: "Clientes", show: features.clients },
    { href: "/painel/servicos", label: "Serviços", show: features.services },
    { href: "/painel/financeiro", label: "Financeiro", show: features.pix || features.mercadopago },
    { href: "/painel/configuracoes", label: "PIX e Mercado Pago", show: true },
  ]
    .filter((i) => i.show)
    .map((i) => ({ href: i.href, label: i.label }));

  return (
    <AppShell title={user.barberProfile.shopName} subtitle="Unidade contratante" nav={nav}>
      {children}
    </AppShell>
  );
}
