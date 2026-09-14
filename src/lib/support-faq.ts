export const SUPPORT_WELCOME =
  "Olá! Sou o assistente do **BARBEIRO ONLINE**. Posso explicar **cadastro da unidade**, **chaves do Mercado Pago**, **agenda**, **fila**, **PIX/cartão**, **portal do cliente** e **planos**. Digite a dúvida, use **Perguntas prontas** ou abra **Falar com a equipe** para conversar com o suporte humano.";

export const SUPPORT_DEFAULT =
  "Não achei um artigo exato para essa frase. Tente **Como ativo minha barbearia?**, **Como cadastro as chaves do Mercado Pago?**, **agenda**, **fila**, **PIX** ou **plano**. Se preferir uma pessoa, use **Falar com a equipe** — o admin recebe a chamada por e-mail.";

const ANSWER_ACTIVATE = `Para **ativar sua barbearia**:

1. Abra **Contratar** no site.
2. Informe nome, e-mail, senha, nome da loja e o plano.
3. Confirme o e-mail enviado por **BARBEIRO ON**.
4. Entre em **/sua-unidade/painel**.
5. Em **Configurações**, cadastre as **chaves do Mercado Pago da unidade** (Public Key + Access Token) para receber PIX e cartão dos clientes.
6. Em **Agenda**, libere horários. Só o que você publicar aparece para o cliente.

A loja já nasce no ar em **/nome-da-loja**. O período de teste começa na criação. A **mensalidade** da plataforma é outra conta: ela usa o Mercado Pago do **admin**, em **Painel → Plano**.`;

const ANSWER_MP_KEYS = `Há **dois cadastros** de Mercado Pago. Não misture as chaves.

**1. Chaves da sua unidade (cobrar o cliente no corte)**
- Entre no **painel da loja** → **Configurações** → bloco **Recebimentos do contratante**.
- Cole a **Public Key** e o **Access Token** (começa com **APP_USR-**).
- Salve em **Salvar pagamentos**.
- Sem as duas chaves, o cliente **não consegue** pagar PIX/cartão na loja.

**Como pegar as chaves no Mercado Pago**
1. Acesse sua conta em mercadopago.com.br
2. Abra **Seu negócio** → **Integrações** → **Credenciais** (produção, não teste).
3. Copie **Public Key** e **Access Token**.
4. Cole no painel e salve.

**2. Chaves da plataforma (mensalidade do barbeiro)**
- Só o **admin** cadastra, em **Admin → PIX e Mercado Pago**.
- Essas chaves cobram o **plano** da barbearia, não o corte do cliente.

A chave PIX avulsa no cadastro **não cobra mais o cliente**. PIX e cartão do corte passam só pelo Mercado Pago da unidade. Depois de salvar as chaves, teste em **Cobrar PIX/cartão** ou peça ao cliente **Pagar agora**.`;

const ANSWER_PAY = `No corte, PIX e cartão passam pelo **Mercado Pago da unidade**.

- O cliente toca **Pagar agora**.
- O barbeiro toca **Cobrar PIX/cartão**.
- A tela espera a escolha do meio. O **QR do Pix só abre depois** de selecionar Pix — ele não some e não escolhe sozinho.
- A confirmação entra **sozinha** no sistema.

Se a tela pede para cadastrar chaves, falta **Public Key + Access Token** em **Painel → Configurações**. A mensalidade da loja é outra: **Painel → Plano**, com o Mercado Pago da **plataforma**.`;

export const SUPPORT_QUICK_QUESTIONS = [
  "Como ativo minha barbearia?",
  "Como cadastro as chaves do Mercado Pago?",
  "Como o cliente agenda um horário?",
  "Como funciona a fila ao vivo?",
  "Como receber PIX e cartão no corte?",
  "O QR do Pix some ou escolhe sozinho?",
  "Onde o cliente vê Meus horários?",
  "Como funciona o período de teste e os planos?",
  "Como entrar no painel da unidade?",
  "Esqueci a senha. E agora?",
  "Como falo com o suporte humano?",
];

type Knowledge = { id: string; keywords: string[]; phrases: string[]; answer: string };

const KNOWLEDGE: Knowledge[] = [
  {
    id: "hello",
    keywords: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "hey", "alo"],
    phrases: [],
    answer:
      "Olá! Pergunte sobre **ativar a loja**, **chaves do Mercado Pago**, agenda, fila, PIX ou planos. Ou abra **Perguntas prontas**. Para uma pessoa, use **Falar com a equipe**.",
  },
  {
    id: "activate",
    keywords: ["ativar", "ativo", "ativa", "ativacao", "contratar", "cadastro", "cadastrar", "criar", "unidade", "barbearia", "loja", "abrir"],
    phrases: ["como ativo", "como ativar", "ativar minha", "criar unidade", "abrir loja", "contratar unidade", "cadastrar barbearia"],
    answer: ANSWER_ACTIVATE,
  },
  {
    id: "mp-keys",
    keywords: ["chave", "chaves", "token", "tokens", "public", "access", "credencial", "credenciais", "app_usr", "app usr"],
    phrases: [
      "cadastrar o mercado pago",
      "cadastro o mercado pago",
      "cadastro minha chave",
      "cadastrar chave",
      "chaves do mercado",
      "chave do mercado",
      "public key",
      "access token",
      "como cadastrar o mercado",
    ],
    answer: ANSWER_MP_KEYS,
  },
  {
    id: "pay",
    keywords: ["pix", "cartao", "qr", "cobrar", "pagar", "pagamento", "mercadopago"],
    phrases: ["receber pix", "pix e cartao", "qr do pix", "pagar agora"],
    answer: ANSWER_PAY,
  },
  {
    id: "login",
    keywords: ["login", "entrar", "senha", "esqueci", "recuperar", "redefinir"],
    phrases: ["esqueci a senha", "como entrar"],
    answer:
      "Use **Entrar** com e-mail e senha. Cliente, barbeiro e admin usam o mesmo login; cada um cai na área certa. Cliente deve entrar pelo **link da loja**. Esqueceu a senha? Toque **Esqueci a senha** na tela de login. O e-mail de redefinição vale **1 hora**. Sem confirmar o e-mail da conta, o login não abre.",
  },
  {
    id: "agenda",
    keywords: ["agenda", "horario", "horarios", "slot", "liberar", "encaixe"],
    phrases: ["liberar horario", "cliente agenda"],
    answer:
      "No **painel → Agenda**, o barbeiro **libera horários** (pode marcar **Só a fila do dia**). Só o que foi publicado aparece na página da loja. O cliente escolhe serviço, data e um horário livre. Encaixe manual também entra pela agenda do barbeiro.",
  },
  {
    id: "queue",
    keywords: ["fila", "proximo", "vez", "sinal"],
    phrases: ["fila ao vivo", "voce e o proximo"],
    answer:
      "A **fila do dia** mostra quem está na cadeira, quem é o próximo e quem já concluiu. Cliente e barbeiro veem a **mesma ordem**, ao vivo, sem recarregar. No portal, o cliente vê **Você é o próximo** quando for a vez dele.",
  },
  {
    id: "client",
    keywords: ["cliente", "portal", "agendar"],
    phrases: ["meus horarios", "portal do cliente"],
    answer:
      "O cliente entra pelo link da loja, cria conta **naquela unidade** e agenda. Em **Meus horários** ele vê os ativos, paga, exclui o que ainda não foi pago e acompanha a fila. **Agendar de novo** volta para a vitrine. Dúvidas da conta? Ele também pode abrir uma **conversa com o suporte** da plataforma.",
  },
  {
    id: "plan",
    keywords: ["plano", "planos", "teste", "assinatura", "preco", "valor", "mensalidade"],
    phrases: ["periodo de teste", "dias de teste"],
    answer:
      "O **admin** define planos e **dias de teste**. Toda unidade nova começa no teste, sem cobrança. Depois o barbeiro escolhe o plano em **Painel → Plano** e paga com o Mercado Pago da **plataforma** (não o da loja). Plano desativado some da contratação; excluir tira o plano de verdade. Nos últimos 10 dias do ciclo dá para renovar.",
  },
  {
    id: "panel",
    keywords: ["painel", "barbeiro", "endereco", "slug"],
    phrases: ["entrar no painel", "link da unidade"],
    answer:
      "A vitrine é **/sua-unidade**. O painel é **/sua-unidade/painel** (Agenda, Clientes, Serviços, Financeiro, Configurações, Plano, **Suporte**). O cliente usa **/sua-unidade/portal**. Compartilhe o link da vitrine — é a casa digital da loja, não um perfil de rede.",
  },
  {
    id: "finance",
    keywords: ["financeiro", "caixa", "relatorio", "movimento"],
    phrases: [],
    answer:
      "Em **Financeiro** o barbeiro vê os movimentos da unidade, filtra por mês/ano e gera relatório (CSV ou impressão). Pagamentos confirmados pelo Mercado Pago entram sozinhos.",
  },
  {
    id: "admin",
    keywords: ["admin", "plataforma", "aprovar", "comando"],
    phrases: [],
    answer:
      "O **admin** fica em **/admin**: usuários, planos, PIX da plataforma e **Suporte**. Ele define o teste, o valor de cada barbeiro, ativa ou exclui planos e conecta o Mercado Pago que cobra a **assinatura**. Também atende as **conversas** de barbeiros e clientes.",
  },
  {
    id: "human",
    keywords: ["humano", "equipe", "chamado", "conversa", "atendente"],
    phrases: ["falar com a equipe", "suporte humano", "mensagem a equipe"],
    answer:
      "O assistente responde na hora. Se não resolver, abra **Falar com a equipe**: nasce uma **conversa** com o suporte da plataforma. O **admin** recebe e-mail quando a chamada é **criada** e quando é **encerrada**. Barbeiro e cliente acompanham em **Suporte** no painel ou no portal, e também neste chat.",
  },
  {
    id: "thanks",
    keywords: ["obrigado", "valeu", "obg", "thanks"],
    phrases: [],
    answer: "Por nada! Se travar em chaves, agenda ou pagamento, pergunte de novo ou abra **Falar com a equipe**.",
  },
];

const QUICK_TO_ID: Record<string, string> = {
  "como ativo minha barbearia": "activate",
  "como cadastro as chaves do mercado pago": "mp-keys",
  "como cadastro as chaves do mercadopago": "mp-keys",
  "como cadastrar o mercado pago": "mp-keys",
  "como cadastro minha chaves do mercado pago": "mp-keys",
  "como cadastro minhas chaves do mercado pago": "mp-keys",
  "como o cliente agenda um horario": "agenda",
  "como funciona a fila ao vivo": "queue",
  "como receber pix e cartao no corte": "pay",
  "o qr do pix some ou escolhe sozinho": "pay",
  "onde o cliente ve meus horarios": "client",
  "como funciona o periodo de teste e os planos": "plan",
  "como entrar no painel da unidade": "panel",
  "esqueci a senha e agora": "login",
  "o que o admin da plataforma faz": "admin",
  "como falo com o suporte humano": "human",
};

const STOP = new Set([
  "como",
  "minha",
  "minhas",
  "meu",
  "meus",
  "uma",
  "uns",
  "para",
  "com",
  "que",
  "por",
  "dos",
  "das",
  "nao",
  "agora",
  "isso",
  "esse",
  "essa",
  "the",
  "and",
  "ou",
  "do",
  "da",
  "de",
  "no",
  "na",
  "em",
  "ao",
  "os",
  "as",
  "um",
]);

const ALIAS: Record<string, string> = {
  ativo: "ativar",
  ativa: "ativar",
  ative: "ativar",
  ativar: "ativar",
  ativacao: "ativar",
  cadastro: "cadastrar",
  cadastrar: "cadastrar",
  cadastre: "cadastrar",
  cadastrando: "cadastrar",
  chave: "chave",
  chaves: "chave",
  token: "token",
  tokens: "token",
  credencial: "chave",
  credenciais: "chave",
  barbearia: "barbearia",
  barbearias: "barbearia",
  loja: "loja",
  unidade: "unidade",
  mercadopago: "mercadopago",
  pix: "pix",
  cartao: "cartao",
  cartoes: "cartao",
  horario: "horario",
  horarios: "horario",
  fila: "fila",
  plano: "plano",
  planos: "plano",
  senha: "senha",
  painel: "painel",
};

export function normalizeSupportText(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/mercado\s+pago/g, "mercadopago")
    .replace(/\bmp\b/g, "mercadopago")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canon(word: string) {
  if (ALIAS[word]) return ALIAS[word];
  return word.replace(/(acoes|coes)$/g, "cao").replace(/oes$/g, "ao").replace(/s$/, "");
}

function tokens(s: string) {
  return normalizeSupportText(s)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(canon);
}

function articleById(id: string) {
  return KNOWLEDGE.find((row) => row.id === id);
}

export function matchSupportFaq(question: string): { answer: string; score: number; id?: string } {
  const q = normalizeSupportText(question);
  if (!q) return { answer: SUPPORT_DEFAULT, score: 0 };

  const quickId = QUICK_TO_ID[q];
  if (quickId) {
    const row = articleById(quickId);
    if (row) return { answer: row.answer, score: 20, id: row.id };
  }

  const qTokens = tokens(q);
  const wantsKeys =
    (q.includes("chave") || q.includes("token") || q.includes("public") || q.includes("access") || q.includes("cadastr")) &&
    (q.includes("mercadopago") || q.includes("mercado"));
  const wantsActivate =
    (q.includes("ativ") || q.includes("contrat") || q.includes("criar")) &&
    (q.includes("barbearia") || q.includes("unidade") || q.includes("loja"));

  if (wantsKeys) {
    const row = articleById("mp-keys");
    if (row) return { answer: row.answer, score: 12, id: row.id };
  }
  if (wantsActivate) {
    const row = articleById("activate");
    if (row) return { answer: row.answer, score: 12, id: row.id };
  }

  let best: { score: number; answer: string; id: string } | null = null;
  for (const row of KNOWLEDGE) {
    let score = 0;
    for (const phrase of row.phrases) {
      if (q.includes(normalizeSupportText(phrase))) score += 6;
    }
    const kw = tokens(row.keywords.join(" "));
    const unique = new Set(kw);
    for (const t of qTokens) {
      if (unique.has(t)) score += 2;
    }
    for (const raw of row.keywords) {
      const n = normalizeSupportText(raw);
      if (n.length > 3 && q.includes(n)) score += 2;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, answer: row.answer, id: row.id };
  }

  if (best && best.score >= 2) return best;
  return { answer: SUPPORT_DEFAULT, score: best?.score || 0 };
}

export const SUPPORT_SYSTEM_PROMPT = `Você é o assistente de suporte do BARBEIRO ONLINE (barbearias, português do Brasil).
Regras:
- Responda só sobre este sistema.
- Se a pergunta for "como ativo minha barbearia", explique Contratar, e-mail, painel, chaves MP da unidade e Agenda.
- Se perguntarem como cadastrar Mercado Pago / chaves: unidade = Painel → Configurações → Public Key + Access Token (APP_USR-). Plataforma/mensalidade = Admin → PIX e Mercado Pago. Não misturar.
- PIX do corte só abre o QR depois de escolher Pix.
- Se não souber, mande usar Falar com a equipe.
- Direto, com **negrito** moderado.`;
