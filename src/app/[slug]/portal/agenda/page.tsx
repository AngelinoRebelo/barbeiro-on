import { requireClient } from "@/lib/auth";
import { PortalAgenda } from "@/components/portal-agenda";

export default async function PortalAgendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireClient(slug);
  return <PortalAgenda slug={slug} />;
}
