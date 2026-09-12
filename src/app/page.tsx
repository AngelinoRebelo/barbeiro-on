import type { Metadata } from "next";
import { LandingHome } from "@/components/landing-home";

export const metadata: Metadata = {
  title: "BARBEIRO ONLINE · A rede das unidades que cortam o futuro",
  description:
    "Sistema operacional de barbearias: agenda viva, fila ao vivo, PIX e Mercado Pago no corte, portal do cliente em /sua-unidade.",
};

export default function HomePage() {
  return <LandingHome />;
}
