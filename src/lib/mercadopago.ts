import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { appUrl } from "./utils";

export function mpClient(accessToken: string) {
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

export async function createCheckoutPreference(opts: {
  accessToken: string;
  paymentId: string;
  title: string;
  amountCents: number;
  payerEmail: string;
  backPath: string;
}) {
  const preference = new Preference(mpClient(opts.accessToken));
  const amount = Number((opts.amountCents / 100).toFixed(2));
  const back = `${appUrl()}${opts.backPath}`;

  const created = await preference.create({
    body: {
      items: [
        {
          id: opts.paymentId,
          title: opts.title.slice(0, 120),
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: { email: opts.payerEmail },
      back_urls: {
        success: `${back}?status=success`,
        failure: `${back}?status=failure`,
        pending: `${back}?status=pending`,
      },
      auto_return: "approved",
      external_reference: opts.paymentId,
      notification_url: `${appUrl()}/api/payments/webhook/mercadopago`,
      statement_descriptor: "BARBEIROON",
    },
  });

  return {
    id: created.id || "",
    initPoint: created.init_point || created.sandbox_init_point || "",
  };
}

export async function getMpPayment(accessToken: string, paymentId: string) {
  const api = new Payment(mpClient(accessToken));
  return api.get({ id: paymentId });
}

export async function createMpApiPayment(
  accessToken: string,
  body: Record<string, unknown>,
  idempotencyKey: string,
) {
  const api = new Payment(mpClient(accessToken));
  return api.create({
    body: body as never,
    requestOptions: { idempotencyKey },
  });
}
