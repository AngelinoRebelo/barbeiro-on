import Link from "next/link";
import { Card, Logo } from "@/components/ui";
import { BarberRegisterForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default function CadastroPage() {
  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">Contratar unidade</h1>
        <p className="mb-6 text-sm text-[#8b93a7]">
          Ao criar, nasce o endereço /nome-da-barbearia para seus clientes. Confirmação por BARBEIRO_ON.
        </p>
        <BarberRegisterForm />
        <p className="mt-6 text-sm text-[#8b93a7]">
          Já é barbeiro? <Link className="text-gold" href="/login">Entrar no painel</Link>
        </p>
      </Card>
    </div>
  );
}
