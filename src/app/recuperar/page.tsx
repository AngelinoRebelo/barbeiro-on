"use client";

import { useState } from "react";
import { Card, Logo, Button, Field, inputClass } from "@/components/ui";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <Logo />
        <h1 className="mt-6 text-2xl font-semibold">Recuperar senha</h1>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await fetch("/api/auth/forgot", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ email }),
            });
            const data = await res.json();
            setMsg(data.message || data.error);
          }}
        >
          <Field label="E-mail">
            <input className={inputClass()} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          {msg && <p className="text-sm text-cyan">{msg}</p>}
          <Button className="w-full">Enviar link</Button>
        </form>
      </Card>
    </div>
  );
}
