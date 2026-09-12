import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { redirect } from "next/navigation";
import { shopPath } from "@/lib/paths";
import { PlanPay } from "@/components/plan-pay";
import { canPayPlan, daysLeft, hasAccess, isOnTrial, renewOpensAt } from "@/lib/access";
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
  const trial = isOnTrial(user.barberProfile.trialUntil);
  const trialLeft = daysLeft(user.barberProfile.trialUntil);
  const canPay = canPayPlan(until, user.barberProfile.trialUntil);
  const renewFrom = renewOpensAt(until);
  if (plan && !canPay) await closePendingSubscriptions(user.barberProfile.id);
  if (plan && canPay) await syncPendingSubscription(user.barberProfile.id, priceCents);
  const last = await lastPaidSubscription(user.barberProfile.id);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-2xl">{trial ? "Período de teste" : open ? "Plano ativo" : "Acesso encerrado"}</h2>
        {trial && (
          <p className="mt-3 rounded-2xl border border-gold/35 bg-[rgba(212,175,55,0.12)] px-4 py-3 text-sm text-gold">
            Conta gratuita em período de teste
            {trialLeft === 1 ? " · resta 1 dia." : ` · restam ${trialLeft} dias.`}
          </p>
        )}
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
        {open && !canPay && !trial && renewFrom && (
          <p className="mt-3 text-sm text-[#8b93a7]">
            Nova cobrança só a partir de {formatDay(renewFrom)} (10 dias antes do término).
          </p>
        )}
        {trial && (
          <p className="mt-3 text-sm text-[#8b93a7]">
            Você pode pagar o plano agora, antes do fim do teste.
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
          onTrial={trial}
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
