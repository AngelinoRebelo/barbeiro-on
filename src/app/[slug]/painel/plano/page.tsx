import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { redirect } from "next/navigation";
import { shopPath } from "@/lib/paths";
import { PlanPay } from "@/components/plan-pay";

export default async function PlanoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireUser();
  if (user.role !== "BARBER" || !user.barberProfile) redirect("/login");
  if (user.barberProfile.slug !== slug) redirect(shopPath(user.barberProfile.slug, "/painel/plano"));
  const plan = user.barberProfile.plan;
  const paid = user.barberProfile.subscriptionStatus === "ACTIVE" || (plan && plan.priceCents === 0);

  if (paid) {
    return (
      <Card>
        <h2 className="text-2xl">Plano ativo</h2>
        <p className="mt-3 text-[#8b93a7]">{plan?.name || "Plano"} liberado para {user.barberProfile.shopName}.</p>
      </Card>
    );
  }

  return (
    <PlanPay
      planName={plan?.name || "Plano"}
      priceCents={plan?.priceCents || 0}
      interval={plan?.interval || "MONTHLY"}
    />
  );
}
