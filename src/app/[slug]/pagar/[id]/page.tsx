import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { brl, formatWhen } from "@/lib/utils";
import { Card, Badge } from "@/components/ui";
import { shopPath, isReservedSlug } from "@/lib/paths";
import { credentialsForPayment } from "@/lib/payments";
import { MpCheckout } from "@/components/mp-checkout-lazy";
import { ShopBackdrop, ShopLogo } from "@/components/shop-brand";

export default async function ShopPagarPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  if (isReservedSlug(slug)) notFound();
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      barber: true,
      client: true,
      appointment: { include: { service: true } },
    },
  });
  if (!payment || payment.barber.slug !== slug) notFound();
  const creds = await credentialsForPayment(payment);
  const label = payment.kind === "SUBSCRIPTION" ? "Mensalidade da plataforma" : payment.appointment?.service.name;

  return (
    <ShopBackdrop slug={slug} brandAt={payment.barber.brandAt} contentClassName="grid place-items-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <ShopLogo slug={slug} shopName={payment.barber.shopName} brandAt={payment.barber.brandAt} href={shopPath(slug)} />
        <h1 className="mt-6 text-2xl">Pagamento</h1>
        <p className="text-[#8b93a7]">{payment.barber.shopName} · {label}</p>
        <p className="mt-2 text-4xl text-gold">{brl(payment.amountCents)}</p>
        <div className="mt-3 flex gap-2">
          <Badge>{payment.method === "PIX" ? "PIX" : "Mercado Pago"}</Badge>
          <Badge>{payment.kind === "SUBSCRIPTION" ? "plano" : "serviço"}</Badge>
          <Badge tone={payment.status === "PAID" ? "cyan" : "muted"}>{payment.status === "PAID" ? "Pago" : "A pagar"}</Badge>
        </div>
        <p className="mt-4 text-sm text-[#8b93a7]">Criado em {formatWhen(payment.createdAt)}</p>
        <div className="mt-6">
          {payment.status === "PAID" ? (
            <p className="text-cyan">Pagamento confirmado automaticamente.</p>
          ) : (
            <MpCheckout
              paymentId={payment.id}
              publicKey={creds.publicKey}
              amountCents={payment.amountCents}
              payerEmail={payment.client?.email || ""}
              preferenceId={payment.mpPreferenceId || ""}
            />
          )}
        </div>
      </Card>
    </ShopBackdrop>
  );
}
