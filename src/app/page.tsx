import Link from "next/link";
import { Logo, Button } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="grid-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Entrar</Button>
          </Link>
          <Link href="/cadastro">
            <Button>Contratar</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <p className="text-xs uppercase tracking-[0.42em] text-gold">Sistema operacional de barbearias</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] md:text-7xl">
          A rede das unidades que cortam o futuro.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[#8b93a7]">
          Cada barbearia vive no próprio endereço. O barbeiro escolhe o plano definido pelo admin, cadastra PIX e Mercado Pago para receber pelos cortes, e compartilha /nome-da-loja com os clientes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cadastro">
            <Button>Ativar minha barbearia</Button>
          </Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["01 · Admin", "Define planos, PIX e Mercado Pago da plataforma, aprova unidades e módulos."],
            ["02 · Unidade /nome", "Cada barbeiro ganha um diretório próprio. O painel abre em /sua-loja/painel."],
            ["03 · Cliente na loja", "O cliente entra pelo link da barbearia, cria conta ali e agenda naquela unidade."],
          ].map(([title, body]) => (
            <article key={title} className="glass rounded-3xl p-6">
              <h2 className="text-gold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#c6ccda]">{body}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
