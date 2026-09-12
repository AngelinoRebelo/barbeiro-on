import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { redirect } from "next/navigation";
import { shopPath } from "@/lib/paths";
import { PlanPay } from "@/components/plan-pay";
import { daysLeft, hasAccess } from "@/lib/access";
import { formatDay } from "@/lib/utils";
import { subscriptionAmountCents, syncPendingSubscription } from "@/lib/subscription";

export default async function PlanoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireUser();
  if (user.role !== "BARBER" || !user.barberProfile) redirect("/login");
  if (user.barberProfile.slug !== slug) redirect(shopPath(user.barberProfile.slug, "/painel/plano"));
  const plan = user.barberProfile.plan;
  const priceCents = subscriptionAmountCents(user.barberProfile);
  if (plan) await syncPendingSubscription(user.barberProfile.id, priceCents);
  const until = user.barberProfile.accessUntil;
  const open = hasAccess(until);
  const left = daysLeft(until);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-2xl">{open ? "Plano ativo" : "Acesso encerrado"}</h2>
        <p className="mt-3 text-[#8b93a7]">
          {plan?.name || "Plano"} para {user.barberProfile.shopName}.
          {until
            ? open
              ? ` Vigente até ${formatDay(until)} (${left} dia${left === 1 ? "" : "s"}).`
              : ` Expirou em ${formatDay(until)}.`
            : " Sem vigência cadastrada."}
        </p>
        {plan && (
          <p className="mt-2 text-sm text-[#8b93a7]">
            Cada pagamento libera {plan.durationDays} dias de uso.
          </p>
        )}
      </Card>
      {plan && priceCents > 0 && (
        <PlanPay
          planName={plan.name}
          priceCents={priceCents}
          interval={plan.interval}
          durationDays={plan.durationDays}
        />
      )}
    </div>
  );
}
