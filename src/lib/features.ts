export type FeatureFlags = {
  agenda: boolean;
  clients: boolean;
  services: boolean;
  pix: boolean;
  mercadopago: boolean;
  publicShop: boolean;
};

export const DEFAULT_FEATURES: FeatureFlags = {
  agenda: true,
  clients: true,
  services: true,
  pix: true,
  mercadopago: true,
  publicShop: true,
};

export const FEATURE_LABELS: Record<keyof FeatureFlags, string> = {
  agenda: "Agenda",
  clients: "Clientes",
  services: "Serviços",
  pix: "Pagamento PIX",
  mercadopago: "Mercado Pago",
  publicShop: "Página pública",
};

export function parseFeatures(value: unknown): FeatureFlags {
  const raw = (value ?? {}) as Partial<FeatureFlags>;
  return {
    agenda: raw.agenda !== false,
    clients: raw.clients !== false,
    services: raw.services !== false,
    pix: raw.pix !== false,
    mercadopago: raw.mercadopago !== false,
    publicShop: raw.publicShop !== false,
  };
}
