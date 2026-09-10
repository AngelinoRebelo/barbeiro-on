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
          Admin governa quem entra. O barbeiro opera clientes, agenda e caixa. PIX nativo e Mercado Pago no cartão — com login confirmado por e-mail BARBEIRO_ON.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/cadastro">
            <Button>Ativar minha barbearia</Button>
          </Link>
          <Link href="/cadastro">
            <Button variant="cyan">Agendar como cliente</Button>
          </Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ["01 · Admin", "Aprova barbeiros, suspende contas e liga módulos: agenda, PIX, Mercado Pago, vitrine."],
            ["02 · Unidade", "Cadastro de clientes, serviços de cabelo e barba, agenda do dia e QR da loja."],
            ["03 · Caixa", "Chave PIX do contratante + token Mercado Pago. QR copia-e-cola e checkout no cartão."],
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
