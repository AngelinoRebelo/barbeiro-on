"use client";

import { useEffect, useState } from "react";

export function LandingClock({ withSeconds = false, className = "" }: { withSeconds?: boolean; className?: string }) {
  const [now, setNow] = useState("");

  useEffect(() => {
    const tick = () => {
      setNow(
        new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: withSeconds ? "2-digit" : undefined,
          hour12: false,
          timeZone: "America/Sao_Paulo",
        }).format(new Date()),
      );
    };
    tick();
    const id = window.setInterval(tick, withSeconds ? 1000 : 15000);
    return () => window.clearInterval(id);
  }, [withSeconds]);

  return <span className={className}>{now}</span>;
}
