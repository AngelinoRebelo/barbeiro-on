import Link from "next/link";
import { Logo, Button, Badge } from "@/components/ui";
import { ShopAtmosphere } from "@/components/shop-atmosphere";
import { LandingClock } from "@/components/landing-clock";

const SIGNALS = [
  "Agenda viva",
  "Fila ao vivo",
  "PIX no corte",
  "Mercado Pago",
  "Portal do cliente",
  "/sua-unidade",
  "Sem aplicativo",
  "Confirmação automática",
];

function SignalDot({ tone = "cyan" }: { tone?: "cyan" | "gold" }) {
  return <span className={`lp-dot ${tone === "gold" ? "lp-dot-gold" : ""}`} aria-hidden="true" />;
}

function SignalQr() {
  return (
    <svg viewBox="0 0 84 84" className="h-[84px] w-[84px]" aria-hidden="true">
      <rect width="84" height="84" rx="8" fill="#f7f7f4" />
      {[
        [6, 6],
        [54, 6],
        [6, 54],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="24" height="24" rx="3" fill="none" stroke="#111" strokeWidth="4" />
          <rect x={x + 7} y={y + 7} width="10" height="10" fill="#111" />
        </g>
      ))}
      <g fill="#111">
        <rect x="38" y="10" width="6" height="6" />
        <rect x="48" y="18" width="6" height="6" />
        <rect x="38" y="26" width="6" height="6" />
        <rect x="58" y="38" width="6" height="6" />
        <rect x="38" y="38" width="6" height="6" />
        <rect x="46" y="46" width="6" height="6" />
        <rect x="38" y="54" width="6" height="6" />
        <rect x="54" y="54" width="6" height="6" />
        <rect x="66" y="62" width="6" height="6" />
        <rect x="38" y="70" width="6" height="6" />
        <rect x="50" y="70" width="6" height="6" />
        <rect x="62" y="70" width="6" height="6" />
        <rect x="18" y="38" width="6" height="6" />
        <rect x="10" y="46" width="6" height="6" />
        <rect x="26" y="46" width="6" height="6" />
      </g>
    </svg>
  );
}

export function LandingHome() {
  return (
    <div className="grid-bg relative min-h-screen overflow-x-hidden">
      <ShopAtmosphere />

      <header className="lp-nav sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <span className="sm:hidden">
            <Logo compact />
          </span>
          <span className="hidden sm:block">
            <Logo />
          </span>
          <nav className="hidden items-center gap-7 text-sm text-[#8b93a7] lg:flex">
            <a href="#sistema" className="transition hover:text-gold">
              Sistema
            </a>
            <a href="#unidade" className="transition hover:text-gold">
              Unidade
            </a>
            <a href="#pagamentos" className="transition hover:text-gold">
              Pagamentos
            </a>
            <a href="#ativar" className="transition hover:text-gold">
              Ativar
            </a>
          </nav>
          <div className="flex gap-3">
            <Link href="/login" prefetch={false}>
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/cadastro" prefetch={false}>
              <Button>Contratar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
          <div>
            <p className="flex items-center gap-3 text-xs uppercase tracking-[0.42em] text-gold">
              <SignalDot tone="gold" />
              Sistema operacional de barbearias
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.02] md:text-7xl">
              A rede das unidades que cortam o futuro.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#8b93a7]">
              Cada barbearia vive no próprio endereço. Agenda, fila, PIX e portal do cliente no ar — sem aplicativo, sem planilha, sem “tem horário?”.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/cadastro">
                <Button className="px-7 py-3">Ativar minha barbearia</Button>
              </Link>
              <a href="#sistema">
                <Button variant="ghost" className="px-7 py-3">
                  Ver o sistema
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-col gap-3 text-sm text-[#8b93a7] sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan/25 bg-cyan/5 px-3 py-1.5 text-cyan">
                <SignalDot />
                Sinal ativo
                <LandingClock className="font-mono text-[11px] tracking-[0.18em]" />
              </span>
              <span>Plano definido pelo admin · PIX e cartão da unidade</span>
            </div>
          </div>

          <div className="relative">
            <div className="lp-orb" aria-hidden="true" />
            <div className="lp-stage relative">
              <article className="glass lp-float overflow-hidden rounded-[28px] p-5 md:pb-28">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-gold">Fila do dia</p>
                    <p className="mt-1 text-lg font-semibold">Unidade em operação</p>
                  </div>
                  <Badge tone="cyan">Ao vivo</Badge>
                </div>
                <div className="space-y-2">
                  <div className="rounded-2xl border border-gold/35 bg-gold/5 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm">
                        <span className="mr-2 font-mono text-gold">01</span>
                        Marcos · Corte
                      </p>
                      <Badge>Em atendimento</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#8b93a7]">09:00 · cadeira ocupada</p>
                  </div>
                  <div className="rounded-2xl border border-cyan/30 bg-cyan/5 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm">
                        <span className="mr-2 font-mono text-cyan">02</span>
                        Rafael · Barba
                      </p>
                      <Badge tone="cyan">Você é o próximo</Badge>
                    </div>
                    <p className="mt-1 text-xs text-[#8b93a7]">09:30 · na espera</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 px-4 py-3 opacity-70">
                    <p className="text-sm">
                      <span className="mr-2 font-mono text-[#8b93a7]">03</span>
                      Caio · Combo
                    </p>
                    <p className="mt-1 text-xs text-[#8b93a7]">10:00 · horário liberado</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["10:30", "11:00", "11:30"].map((time) => (
                    <span key={time} className="rounded-full border border-gold/30 px-3 py-1 font-mono text-xs text-gold">
                      {time}
                    </span>
                  ))}
                </div>
              </article>

              <article className="glass lp-float-delay absolute right-4 -bottom-6 w-[min(100%,260px)] rounded-3xl p-4 max-md:static max-md:mt-4 max-md:w-full">
                <p className="text-[10px] uppercase tracking-[0.28em] text-cyan">Pagamento na cadeira</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="rounded-xl bg-white p-1.5">
                    <SignalQr />
                  </div>
                  <div>
                    <p className="text-sm text-[#8b93a7]">Pix · R$ 45,00</p>
                    <p className="font-mono text-xs text-gold">Aguardando sinal</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <div className="lp-marquee" aria-hidden="true">
          <div className="lp-marquee-track">
            {[0, 1].map((copy) => (
              <p key={copy} className="flex shrink-0 items-center gap-8 px-4">
                {SIGNALS.map((item) => (
                  <span key={`${copy}-${item}`} className="flex items-center gap-8">
                    <span className="text-xs uppercase tracking-[0.32em] text-[#c6ccda]">{item}</span>
                    <span className="text-gold">◆</span>
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        <section id="sistema" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <p className="text-xs uppercase tracking-[0.42em] text-gold">Campanha 01 · Sistema</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight md:text-5xl">
            A barbearia deixa de ser recado. Vira operação.
          </h2>
          <p className="mt-4 max-w-2xl text-[#8b93a7]">
            O que o barbeiro libera no painel aparece no celular do cliente. A fila anda sozinha. O caixa confirma sozinho.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                k: "01",
                t: "Agenda viva",
                d: "Horários publicados pela unidade. O cliente escolhe o que está livre — não o que alguém prometeu no WhatsApp.",
              },
              {
                k: "02",
                t: "Fila em sinal",
                d: "Quem está na cadeira, quem é o próximo, quem já concluiu. A loja e o cliente veem a mesma ordem, ao vivo.",
              },
              {
                k: "03",
                t: "Portal do cliente",
                d: "Conta na própria barbearia. Meus horários, vez na fila, pagamento e exclusão do que ainda não foi pago.",
              },
            ].map((item) => (
              <article key={item.k} className="lp-card glass rounded-[28px] p-6">
                <p className="font-mono text-xs tracking-[0.28em] text-gold">{item.k}</p>
                <h3 className="mt-4 text-2xl">{item.t}</h3>
                <p className="mt-3 text-sm leading-7 text-[#c6ccda]">{item.d}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="unidade" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-10 px-6 py-10 lg:grid-cols-2">
          <article className="lp-billboard overflow-hidden rounded-[32px] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.42em] text-gold">Campanha 02 · Unidade</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">
              Cada loja ganha um endereço. Não um perfil.
            </h2>
            <p className="mt-4 max-w-md text-[#c6ccda]">
              A unidade abre em <span className="text-gold">/nome-da-loja</span>. O painel em /painel. O cliente entra, cria conta ali e agenda naquela barbearia — só nela.
            </p>
            <div className="mt-8 rounded-2xl border border-gold/20 bg-black/30 px-5 py-4 font-mono text-sm">
              <span className="text-[#8b93a7]">/</span>
              <span className="text-gold">sua-unidade</span>
            </div>
          </article>
          <div className="grid gap-4">
            {[
              ["Admin", "Define planos, valor por unidade, PIX da plataforma e pode revogar lojas."],
              ["Barbeiro", "Opera agenda, clientes, serviços, financeiro e cobrança no corte."],
              ["Cliente", "Entra pelo link da loja, vê a vez dele e paga sem baixar nada."],
            ].map(([title, body], i) => (
              <article key={title} className="glass flex gap-4 rounded-3xl p-5">
                <span className="font-mono text-sm text-cyan">0{i + 1}</span>
                <div>
                  <h3 className="text-lg">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#8b93a7]">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pagamentos" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <article className="lp-pay relative overflow-hidden rounded-[32px] p-8 md:p-12">
            <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.42em] text-cyan">Campanha 03 · Caixa</p>
                <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
                  O corte termina. O Pix já está na tela.
                </h2>
                <p className="mt-5 max-w-lg text-[#c6ccda]">
                  PIX e cartão passam pelo Mercado Pago da unidade. O cliente ou o barbeiro escolhe o meio. O QR não some. A confirmação entra sozinha no sistema.
                </p>
                <ul className="mt-8 grid gap-3 text-sm text-[#e9edf5] sm:grid-cols-2">
                  <li className="rounded-2xl border border-cyan/20 bg-black/20 px-4 py-3">Pix com QR na hora</li>
                  <li className="rounded-2xl border border-cyan/20 bg-black/20 px-4 py-3">Cartão no Mercado Pago</li>
                  <li className="rounded-2xl border border-cyan/20 bg-black/20 px-4 py-3">Confirmação automática</li>
                  <li className="rounded-2xl border border-cyan/20 bg-black/20 px-4 py-3">Financeiro da unidade</li>
                </ul>
              </div>
              <div className="glass rounded-[28px] bg-[#0b0d14]/80 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Combo · 45 min</p>
                  <Badge tone="cyan">A pagar</Badge>
                </div>
                <p className="mt-6 font-mono text-4xl text-cyan">R$ 45,00</p>
                <div className="mt-6 grid gap-2">
                  {["Pix", "Cartão de crédito", "Mercado Pago"].map((method) => (
                    <div
                      key={method}
                      className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-[#c6ccda]"
                    >
                      {method}
                      <span className="h-3.5 w-3.5 rounded-full border border-white/25" />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-[#8b93a7]">Nada é cobrado até o meio ser escolhido.</p>
              </div>
            </div>
          </article>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-8">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Ao vivo", "Fila e horários atualizam sem recarregar a página."],
              ["Por loja", "Cliente, agenda e caixa pertencem à unidade."],
              ["No corte", "Cobrança PIX/cartão na cadeira, com QR estável."],
              ["No celular", "O cliente opera pelo link. Sem app para instalar."],
            ].map(([t, d]) => (
              <article key={t} className="rounded-3xl border border-white/8 px-5 py-6">
                <h3 className="text-gold">{t}</h3>
                <p className="mt-2 text-sm leading-6 text-[#8b93a7]">{d}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="ativar" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
          <article className="lp-cta relative overflow-hidden rounded-[36px] px-8 py-14 text-center md:px-16">
            <p className="text-xs uppercase tracking-[0.42em] text-gold">Pronto para o ar</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
              Ligue a unidade. O resto da cidade chega pelo link.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[#c6ccda]">
              Escolha o plano definido pelo admin, cadastre o Mercado Pago da loja e compartilhe /nome-da-loja. A operação começa no mesmo dia.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/cadastro">
                <Button className="px-8 py-3 text-base">Ativar minha barbearia</Button>
              </Link>
              <Link href="/login" prefetch={false}>
                <Button variant="ghost" className="px-8 py-3 text-base">
                  Já tenho unidade
                </Button>
              </Link>
            </div>
          </article>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-[#8b93a7]">
          <p>BARBEIRO ONLINE · operação de unidades</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-gold">
              Entrar
            </Link>
            <Link href="/cadastro" className="hover:text-gold">
              Contratar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
