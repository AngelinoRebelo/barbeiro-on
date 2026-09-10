import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { qrDataUrl } from "@/lib/qr";
import { brl, formatWhen } from "@/lib/utils";
import { Card, Badge, Logo } from "@/components/ui";
import { PayActions } from "@/components/pay-actions";

export default async function PagarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      barber: true,
      client: true,
      appointment: { include: { service: true } },
    },
  });
  if (!payment) notFound();
  const session = await getSession();
  const isBarber = session?.role === "BARBER" && session.sub === payment.barber.userId;
  const isAdmin = session?.role === "ADMIN";
  const qr = payment.pixPayload ? await qrDataUrl(payment.pixPayload) : await qrDataUrl(`${process.env.APP_URL || ""}/pagar/${payment.id}`);

  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <Logo />
        <h1 className="mt-6 text-2xl">Pagamento</h1>
        <p className="text-[#8b93a7]">{payment.barber.shopName} · {payment.appointment?.service.name}</p>
        <p className="mt-2 text-4xl text-gold">{brl(payment.amountCents)}</p>
        <div className="mt-3 flex gap-2">
          <Badge>{payment.method}</Badge>
          <Badge tone={payment.status === "PAID" ? "cyan" : "muted"}>{payment.status}</Badge>
        </div>
        {sp.status && <p className="mt-3 text-sm text-cyan">Retorno Mercado Pago: {sp.status}</p>}
        {payment.method === "PIX" && payment.pixPayload && payment.status !== "PAID" && (
          <div className="mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR PIX" className="w-56 rounded-2xl" />
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#8b93a7]">PIX copia e cola</p>
            <p className="mt-1 break-all font-mono text-xs text-gold">{payment.pixPayload}</p>
          </div>
        )}
        <p className="mt-4 text-sm text-[#8b93a7]">Criado em {formatWhen(payment.createdAt)}</p>
        <PayActions
          id={payment.id}
          method={payment.method}
          status={payment.status}
          initPoint={payment.mpInitPoint}
          canConfirm={Boolean(isBarber || isAdmin)}
        />
      </Card>
    </div>
  );
}
