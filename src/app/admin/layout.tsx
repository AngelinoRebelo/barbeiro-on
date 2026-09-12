import { requireAdmin } from "@/lib/auth";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const nav = [
    { href: "/admin", label: "Visão geral" },
    { href: "/admin/usuarios", label: "Usuários" },
    { href: "/admin/financeiro", label: "Financeiro" },
    { href: "/admin/planos", label: "Planos" },
    { href: "/admin/pagamentos", label: "PIX e Mercado Pago" },
    { href: "/admin/suporte", label: "Suporte" },
  ];

  return (
    <AppShell title="Comando central" subtitle="Admin da plataforma" nav={nav}>
      {children}
    </AppShell>
  );
}
