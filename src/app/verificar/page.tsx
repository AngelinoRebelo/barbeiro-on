"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Logo } from "@/components/ui";
import { Suspense } from "react";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [msg, setMsg] = useState("Validando seu e-mail...");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setMsg("Link incompleto.");
      return;
    }
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) setMsg(data.error || "Não foi possível confirmar.");
        else router.replace(data.redirect || "/login");
      })
      .catch(() => setMsg("Falha de rede."));
  }, [params, router]);

  return <p className="mt-6 text-[#c6ccda]">{msg}</p>;
}

export default function VerificarPage() {
  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">Confirmação de conta</h1>
        <Suspense>
          <VerifyInner />
        </Suspense>
      </Card>
    </div>
  );
}
