"use client";

import { Suspense } from "react";
import { Card } from "@/components/ui";
import { SupportDesk } from "@/components/support-desk";

export default function BarberSupportPage() {
  return (
    <div className="space-y-4">
      <Card>
        <h2>Suporte da plataforma</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">
          Fale com o admin do BARBEIRO ONLINE. Abrir ou encerrar uma chamada dispara e-mail para o dono da plataforma.
        </p>
      </Card>
      <Suspense fallback={<p className="text-sm text-[#8b93a7]">Carregando conversas…</p>}>
        <SupportDesk />
      </Suspense>
    </div>
  );
}
