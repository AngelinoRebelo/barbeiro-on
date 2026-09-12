import { requireBarber } from "@/lib/auth";
import { BarberFinance } from "@/components/barber-finance";

export default async function FinanceiroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireBarber(slug);
  return <BarberFinance />;
}
