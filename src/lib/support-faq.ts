export const SUPPORT_WELCOME =
  "Olá! Sou o assistente de suporte online do BARBEIRO ONLINE. Posso ajudar com **qualquer função do site**: **agenda viva**, **fila ao vivo**, **PIX e Mercado Pago**, **portal do cliente**, **planos e teste**, **cadastro da unidade** e **painel do barbeiro**. Digite sua dúvida ou use **Perguntas prontas**. **Voltar** fecha o painel; **Encerrar** começa uma conversa nova.";

export const SUPPORT_DEFAULT =
  "Não encontrei uma resposta específica para isso. Tente palavras como **agenda**, **fila**, **PIX**, **plano**, **cadastro**, **cliente** ou **horário**, ou abra **Perguntas prontas**. Se precisar de ajuda humana, use **«Não resolveu? Mensagem à equipe»**.";

export const SUPPORT_QUICK_QUESTIONS = [
  "Como ativo minha barbearia?",
  "Como o cliente agenda um horário?",
  "Como funciona a fila ao vivo?",
  "Como receber PIX e cartão no corte?",
  "O QR do Pix some ou escolhe sozinho?",
  "Onde o cliente vê Meus horários?",
  "Como funciona o período de teste e os planos?",
  "Como entrar no painel da unidade?",
  "Esqueci a senha. E agora?",
  "O que o admin da plataforma faz?",
];

type Knowledge = { keywords: string[]; answer: string };

const KNOWLEDGE: Knowledge[] = [
  {
    keywords: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "hey", "alo"],
    answer:
      "Olá! Sou o assistente de suporte do BARBEIRO ONLINE. Pergunte sobre agenda, fila, PIX, portal do cliente ou planos — ou abra **Perguntas prontas**.",
  },
  {
    keywords: ["ajuda", "suporte", "como funciona", "duvida", "help", "o que e"],
    answer:
      "O BARBEIRO ONLINE é o **sistema operacional da barbearia**. Cada unidade ganha um endereço **/nome-da-loja**. O barbeiro libera horários no **painel**, o cliente agenda ali, vê a **fila ao vivo** e paga com **PIX ou cartão Mercado Pago**. Admin da plataforma define planos, aprova unidades e o PIX da plataforma.",
  },
  {
    keywords: ["ativar", "cadastrar barbearia", "contratar", "criar unidade", "abrir loja"],
    answer:
      "Em **Contratar**, o barbeiro cria a unidade. Nasce o endereço **/nome-da-loja**. Depois o **admin aprova** a loja, o barbeiro escolhe o **plano**, cadastra **Public Key e Access Token** do Mercado Pago e libera horários na **Agenda**.",
  },
  {
    keywords: ["login", "entrar", "senha", "esqueci", "recuperar", "redefinir"],
    answer:
      "Use **Entrar** com e-mail e senha. Cliente, barbeiro e admin entram no mesmo login; depois cada um segue para a área certa. Se esqueceu a senha, use **recuperar** na tela de login. O e-mail de redefinição expira em 1 hora.",
  },
  {
    keywords: ["agenda", "horario", "horarios", "slot", "liberar", "encaixe"],
    answer:
      "No **painel → Agenda**, o barbeiro **libera horários** (e pode usar **Só a fila do dia**). Só o que foi publicado aparece para o cliente na página da loja. O cliente escolhe serviço, data e um horário livre. Encaixe manual também entra pela agenda do barbeiro.",
  },
  {
    keywords: ["fila", "proximo", "vez", "ao vivo", "sinal"],
    answer:
      "A **fila do dia** mostra quem está na cadeira, quem é o próximo e quem já concluiu. Cliente e barbeiro veem a **mesma ordem**, ao vivo, sem recarregar a página. No portal, o cliente vê **Você é o próximo** quando for a vez dele.",
  },
  {
    keywords: ["pix", "cartao", "mercadopago", "mercado pago", "qr", "cobrar", "pagar"],
    answer:
      "PIX e cartão passam pelo **Mercado Pago da unidade** (Public Key + Access Token em **PIX e Mercado Pago**). O cliente usa **Pagar agora**; o barbeiro usa **Cobrar PIX/cartão**. A tela de **meios de pagamento** espera a escolha — o QR só abre **depois** de selecionar Pix. A confirmação entra **sozinha** no sistema.",
  },
  {
    keywords: ["cliente", "portal", "meus horarios", "agendar"],
    answer:
      "O cliente entra pelo link da loja, cria conta **naquela unidade** e agenda. Em **Meus horários** ele vê ativos, paga, exclui o que ainda não foi pago e acompanha a fila. **Agendar de novo** volta para a vitrine da loja.",
  },
  {
    keywords: ["plano", "planos", "teste", "assinatura", "preco", "valor", "mensalidade"],
    answer:
      "O **admin** define os planos e os **dias de teste**. Toda unidade nova começa no teste, sem cobrança. Depois o barbeiro escolhe o plano em **Painel → Plano** e paga com o Mercado Pago da **plataforma**. Plano **desativado** some da contratação; **excluir** tira o plano de verdade.",
  },
  {
    keywords: ["painel", "barbeiro", "unidade", "endereco", "slug", "loja"],
    answer:
      "A vitrine é **/sua-unidade**. O painel é **/sua-unidade/painel** (Agenda, Clientes, Serviços, Financeiro, PIX, Plano). O cliente usa **/sua-unidade/portal**. Compartilhe o link da vitrine — não é um perfil em rede, é a casa digital da loja.",
  },
  {
    keywords: ["financeiro", "caixa", "relatorio", "movimento"],
    answer:
      "Em **Financeiro** o barbeiro vê os movimentos da unidade, filtra por mês/ano e gera relatório (CSV ou impressão). Pagamentos confirmados pelo Mercado Pago entram sozinhos.",
  },
  {
    keywords: ["admin", "plataforma", "aprovar", "comando"],
    answer:
      "O **admin** fica em **/admin**: usuários, planos, PIX da plataforma e aprovação de unidades. Ele define o teste padrão, ativa ou exclui planos e conecta o Mercado Pago que cobra a **assinatura** das barbearias.",
  },
  {
    keywords: ["obrigado", "valeu", "obg", "thanks"],
    answer: "Por nada! Se precisar de mais alguma coisa sobre o sistema, é só perguntar.",
  },
];

function normalize(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchSupportFaq(question: string): { answer: string; score: number } {
  const q = normalize(question);
  if (!q) return { answer: SUPPORT_DEFAULT, score: 0 };

  let best: { score: number; answer: string } | null = null;
  for (const row of KNOWLEDGE) {
    let score = 0;
    for (const kw of row.keywords) {
      if (q.includes(normalize(kw))) score += 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, answer: row.answer };
  }
  if (best && best.score >= 2) return best;

  const words = q.split(" ").filter((w) => w.length > 2);
  for (const row of KNOWLEDGE) {
    let score = 0;
    for (const w of words) {
      for (const kw of row.keywords) {
        const n = normalize(kw);
        if (n.includes(w) || w.includes(n)) score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { score, answer: row.answer };
  }
  if (best && best.score >= 2) return best;
  return { answer: SUPPORT_DEFAULT, score: best?.score || 0 };
}
