import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { SupportChat } from "@/components/support-chat";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jb",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BARBEIRO ONLINE",
  description: "Gestão de unidades, clientes, agenda e pagamentos PIX + Mercado Pago.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <SupportChat />
      </body>
    </html>
  );
}
