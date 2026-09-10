import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { shopPath } from "@/lib/paths";

export default async function LegacyPagarRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { barber: true },
  });
  if (!payment) notFound();
  redirect(shopPath(payment.barber.slug, `/pagar/${payment.id}`));
}
