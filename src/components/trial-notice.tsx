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
