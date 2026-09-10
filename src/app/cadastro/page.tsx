import Link from "next/link";
import { Card, Logo } from "@/components/ui";
import { RegisterForm } from "@/components/auth-forms";

export default function CadastroPage() {
  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">Criar conta</h1>
        <p className="mb-6 text-sm text-[#8b93a7]">Confirmação enviada por BARBEIRO_ON &lt;barbeiro_on@outlook.com&gt;.</p>
        <RegisterForm />
        <p className="mt-6 text-sm text-[#8b93a7]">
          Já confirmou? <Link className="text-gold" href="/login">Entrar</Link>
        </p>
      </Card>
    </div>
  );
}
