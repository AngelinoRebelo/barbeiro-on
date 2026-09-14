import { Suspense } from "react";
import Link from "next/link";
import { Card, Logo } from "@/components/ui";
import { LoginForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">Acesso</h1>
        <p className="mb-6 text-sm text-[#8b93a7]">Cliente, barbeiro e admin. Depois do login, o cliente continua na área da barbearia.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-sm text-[#8b93a7]">
          Sem unidade? <Link className="text-gold" href="/cadastro">Contratar</Link>
        </p>
      </Card>
    </div>
  );
}
