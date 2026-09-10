import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <span className="relative grid h-10 w-10 place-items-center rounded-xl border border-[rgba(212,175,55,0.35)] bg-[#10131c]">
        <span className="absolute inset-1 rounded-lg border border-cyan/20" />
        <span className="font-mono text-[11px] tracking-[0.2em] text-gold">ON</span>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-[11px] tracking-[0.38em] text-gold">BARBEIRO</span>
          <span className="block text-lg font-semibold">plataforma</span>
        </span>
      )}
    </Link>
  );
}

export function Button({
  children,
  className,
  variant = "gold",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "gold" | "ghost" | "danger" | "cyan" }) {
  const map = {
    gold: "bg-gold text-[#07080c] hover:brightness-110",
    cyan: "bg-cyan text-[#07080c] hover:brightness-110",
    ghost: "border border-[rgba(212,175,55,0.28)] bg-transparent text-white hover:border-gold",
    danger: "bg-[#ff5d73] text-white hover:brightness-110",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50",
        map[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-[0.22em] text-[#8b93a7]">{label}</span>
      {children}
    </label>
  );
}

export function inputClass() {
  return "w-full rounded-xl border border-[rgba(212,175,55,0.22)] bg-[#090b12] px-3 py-2.5 text-sm outline-none focus:border-gold";
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("glass rounded-3xl p-6", className)}>{children}</section>;
}

export function Badge({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "cyan" | "muted" | "danger" }) {
  const map = {
    gold: "text-gold border-gold/30",
    cyan: "text-cyan border-cyan/30",
    muted: "text-[#8b93a7] border-white/10",
    danger: "text-[#ff5d73] border-[#ff5d73]/30",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-[0.16em]", map[tone])}>
      {children}
    </span>
  );
}
