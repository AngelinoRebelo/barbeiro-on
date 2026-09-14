"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function LogoutButton({ href = "/login", className }: { href?: string; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <Button
      variant="ghost"
      className={className}
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push(href);
        router.refresh();
      }}
    >
      {loading ? "Saindo..." : "Sair"}
    </Button>
  );
}
