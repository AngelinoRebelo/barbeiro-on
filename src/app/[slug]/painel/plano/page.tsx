import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { redirect } from "next/navigation";
import { shopPath } from "@/lib/paths";
import { PlanPay } from "@/components/plan-pay";
import { canRenewPlan, daysLeft, hasAccess, renewOpensAt } from "@/lib/access";
import { brl, formatDay, formatWhen } from "@/lib/utils";
import { closePendingSubscriptions, lastPaidSubscription, subscriptionAmountCents, syncPendingSubscription } from "@/lib/subscription";

export default async function PlanoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user } = await requireUser();
  if (user.role !== "BARBER" || !user.barberProfile) redirect("/login");
  if (user.barberProfile.slug !== slug) redirect(shopPath(user.barberProfile.slug, "/painel/plano"));
  const plan = user.barberProfile.plan;
  const priceCents = subscriptionAmountCents(user.barberProfile);
  const until = user.barberProfile.accessUntil;
  const open = hasAccess(until);
  const left = daysLeft(until);
  const canPay = canRenewPlan(until);
  const renewFrom = renewOpensAt(until);
  if (plan && !canPay) await closePendingSubscriptions(user.barberProfile.id);
  if (plan && canPay) await syncPendingSubscription(user.barberProfile.id, priceCents);
  const last = await lastPaidSubscription(user.barberProfile.id);

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
        {last && (
          <p className="mt-4 rounded-2xl border border-cyan/25 bg-cyan/5 px-4 py-3 text-sm text-cyan">
            Último pagamento: {brl(last.amountCents)} em {formatWhen(last.paidAt || last.createdAt)}
            {last.method === "PIX" ? " · PIX" : " · Mercado Pago"}.
          </p>
        )}
        {open && !canPay && renewFrom && (
          <p className="mt-3 text-sm text-[#8b93a7]">
            Nova cobrança só a partir de {formatDay(renewFrom)} (10 dias antes do término).
          </p>
        )}
      </Card>
      {plan && priceCents > 0 && (
        <PlanPay
          planName={plan.name}
          priceCents={priceCents}
          interval={plan.interval}
          durationDays={plan.durationDays}
          canPay={canPay}
          renewFrom={renewFrom?.toISOString() ?? null}
          lastPayment={
            last
              ? {
                  amountCents: last.amountCents,
                  paidAt: last.paidAt?.toISOString() ?? null,
                  createdAt: last.createdAt.toISOString(),
                  method: last.method,
                }
              : null
          }
        />
      )}
    </div>
  );
}
