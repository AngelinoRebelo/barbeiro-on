# BARBEIRO ON

Plataforma SaaS para barbearias: admin da rede, painel do barbeiro contratante, portal do cliente, PIX e Mercado Pago.

## Papéis

- **Admin** (`machaddoo@gmail.com`): planos e preços, PIX/Mercado Pago da plataforma, aprovação de unidades.
- **Barbeiro**: ao cadastrar, nasce `/{nome-da-barbearia}`; o painel abre em `/{slug}/painel`. Cadastra PIX/MP próprios para receber pelos serviços.
- **Cliente**: entra pelo link da loja, cria conta em `/{slug}/cadastro` e agenda só naquela unidade.

## E-mail (Brevo)

Remetente verificado: `BARBEIRO_ON <barbeiro_on@outlook.com>`. Defina `BREVO_API_KEY` no Railway.

## Variáveis

Copie `.env.example`. `AUTH_SECRET` precisa ter 16+ caracteres. `DATABASE_URL` vem do Postgres no Railway.

## Deploy

1. Postgres no Railway
2. Variáveis de ambiente
3. Build gera o client Prisma; o start aplica migrations e cria o admin
