import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card, Badge } from "@/components/ui";
import { parseFeatures, FEATURE_LABELS } from "@/lib/features";
import { formatWhen } from "@/lib/utils";

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { barberProfile: { include: { _count: { select: { clients: true, appointments: true, services: true } } } } },
  });
  if (!user) notFound();
  const features = user.barberProfile ? parseFeatures(user.barberProfile.features) : null;

  return (
    <Card>
      <h2 className="text-2xl">{user.name}</h2>
      <p className="text-[#8b93a7]">{user.email}</p>
      <div className="mt-4 flex gap-2">
        <Badge>{user.role}</Badge>
        <Badge tone={user.status === "ACTIVE" ? "cyan" : "muted"}>{user.status}</Badge>
      </div>
      <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
        <div><dt className="text-[#8b93a7]">Criado</dt><dd>{formatWhen(user.createdAt)}</dd></div>
        <div><dt className="text-[#8b93a7]">E-mail verificado</dt><dd>{user.emailVerified ? formatWhen(user.emailVerified) : "não"}</dd></div>
        {user.barberProfile && (
          <>
            <div><dt className="text-[#8b93a7]">Unidade</dt><dd>{user.barberProfile.shopName} · /s/{user.barberProfile.slug}</dd></div>
            <div><dt className="text-[#8b93a7]">Clientes / agenda / serviços</dt><dd>{user.barberProfile._count.clients} / {user.barberProfile._count.appointments} / {user.barberProfile._count.services}</dd></div>
            <div><dt className="text-[#8b93a7]">PIX</dt><dd>{user.barberProfile.pixKey || "não cadastrado"}</dd></div>
            <div><dt className="text-[#8b93a7]">Mercado Pago</dt><dd>{user.barberProfile.mpAccessEnc ? "conectado" : "pendente"}</dd></div>
          </>
        )}
      </dl>
      {features && (
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(FEATURE_LABELS).map(([k, label]) => (
            <Badge key={k} tone={features[k as keyof typeof features] ? "cyan" : "muted"}>
              {label}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
