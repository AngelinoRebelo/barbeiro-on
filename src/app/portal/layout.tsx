import { requireClient } from "@/lib/auth";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireClient();
  const nav = [
    { href: "/portal", label: "Início" },
    { href: "/portal/agenda", label: "Meus horários" },
  ];
  return (
    <AppShell title="Portal do cliente" subtitle="BARBEIRO ON" nav={nav}>
      {children}
    </AppShell>
  );
}
