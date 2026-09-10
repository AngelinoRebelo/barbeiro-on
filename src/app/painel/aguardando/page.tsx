import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";

export default async function AguardandoPage() {
  const { user } = await requireUser();
  return (
    <Card>
      <h2 className="text-2xl">Unidade em análise</h2>
      <p className="mt-3 max-w-xl text-[#8b93a7]">
        {user.name}, sua conta foi confirmada. O admin da plataforma precisa aprovar a barbearia antes de liberar agenda, clientes e pagamentos.
      </p>
    </Card>
  );
}
