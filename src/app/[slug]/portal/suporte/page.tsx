"use client";

import { Suspense } from "react";
import { Card } from "@/components/ui";
import { SupportDesk } from "@/components/support-desk";

export default function ClientSupportPage() {
  return (
    <div className="space-y-4">
      <Card>
        <h2>Falar com o suporte</h2>
        <p className="mt-2 text-sm text-[#8b93a7]">
          Conversa direta com a equipe da plataforma. O admin recebe e-mail ao abrir e ao encerrar a chamada.
        </p>
      </Card>
      <Suspense fallback={<p className="text-sm text-[#8b93a7]">Carregando conversas…</p>}>
        <SupportDesk />
      </Suspense>
    </div>
  );
}
