"use client";

import { useEffect, useState } from "react";

export const PLAN_UPDATED_EVENT = "barber-plan-updated";

export function notifyPlanUpdated() {
  window.dispatchEvent(new Event(PLAN_UPDATED_EVENT));
}

export function TrialNotice({
  daysLeft,
  configuredDays,
}: {
  daysLeft: number;
  configuredDays: number;
}) {
  const remaining = Math.max(0, daysLeft);
  return (
    <div className="mb-6 rounded-2xl border border-gold/35 bg-[rgba(212,175,55,0.12)] px-4 py-3">
      <p className="text-sm font-medium text-gold">Conta gratuita em período de teste</p>
      <p className="mt-1 text-sm text-[#c6ccda]">
        {remaining === 1
          ? "Resta 1 dia de teste grátis."
          : `Restam ${remaining} dias de teste grátis.`}{" "}
        O padrão definido pelo admin é {configuredDays} dia{configuredDays === 1 ? "" : "s"}.
      </p>
    </div>
  );
}

export function TrialNoticeLive({
  initialOnTrial,
  initialDaysLeft,
  initialConfiguredDays,
}: {
  initialOnTrial: boolean;
  initialDaysLeft: number;
  initialConfiguredDays: number;
}) {
  const [onTrial, setOnTrial] = useState(initialOnTrial);
  const [daysLeft, setDaysLeft] = useState(initialDaysLeft);
  const [configuredDays, setConfiguredDays] = useState(initialConfiguredDays);

  async function load() {
    const res = await fetch(`/api/barber/access?t=${Date.now()}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setOnTrial(Boolean(data.onTrial));
    if (typeof data.daysLeft === "number") setDaysLeft(data.daysLeft);
    if (typeof data.configuredDays === "number") setConfiguredDays(data.configuredDays);
  }

  useEffect(() => {
    setOnTrial(initialOnTrial);
    setDaysLeft(initialDaysLeft);
    setConfiguredDays(initialConfiguredDays);
  }, [initialOnTrial, initialDaysLeft, initialConfiguredDays]);

  useEffect(() => {
    const refresh = () => {
      void load();
    };
    window.addEventListener(PLAN_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PLAN_UPDATED_EVENT, refresh);
  }, []);

  if (!onTrial) return null;
  return <TrialNotice daysLeft={daysLeft} configuredDays={configuredDays} />;
}
