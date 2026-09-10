"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Logo, Button, Field, inputClass } from "@/components/ui";

function Inner() {
  const params = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch("/api/auth/reset", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: params.get("token"), password }),
        });
        const data = await res.json();
        if (!res.ok) setMsg(data.error);
        else router.push("/login");
      }}
    >
      <Field label="Nova senha">
        <input className={inputClass()} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      {msg && <p className="text-sm text-[#ff5d73]">{msg}</p>}
      <Button className="w-full">Salvar senha</Button>
    </form>
  );
}

export default function RedefinirPage() {
  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">Nova senha</h1>
        <Suspense>
          <Inner />
        </Suspense>
      </Card>
    </div>
  );
}
