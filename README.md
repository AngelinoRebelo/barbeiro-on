# BARBEIRO ON

Plataforma SaaS para barbearias: admin da rede, painel do barbeiro contratante, portal do cliente, PIX e Mercado Pago.

## Papéis

- **Admin** (`machaddoo@gmail.com`): aprova unidades, suspende contas e liga/desliga módulos.
- **Barbeiro**: clientes, serviços (cabelo/barba), agenda, chave PIX e token Mercado Pago.
- **Cliente**: cadastro com e-mail, agendamento na vitrine pública e pagamento.

## E-mail (Brevo)

Remetente verificado: `BARBEIRO_ON <barbeiro_on@outlook.com>`. Defina `BREVO_API_KEY` no Railway.

## Variáveis

Copie `.env.example`. `AUTH_SECRET` precisa ter 16+ caracteres. `DATABASE_URL` vem do Postgres no Railway.

## Deploy

1. Postgres no Railway
2. Variáveis de ambiente
3. Build gera o client Prisma; o start aplica migrations e cria o admin
