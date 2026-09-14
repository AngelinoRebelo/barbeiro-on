import Link from "next/link";
import { Logo } from "@/components/ui";
import { brandUrl } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function ShopLogo({
  slug,
  shopName,
  brandAt,
  href,
  compact = false,
  className,
}: {
  slug: string;
  shopName: string;
  brandAt?: Date | string | null;
  href: string;
  compact?: boolean;
  className?: string;
}) {
  const src = brandUrl(slug, brandAt);
  if (!src) return <Logo href={href} compact={compact} />;
  return (
    <Link href={href} className={cn("flex min-w-0 items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={shopName}
        className="h-10 w-10 shrink-0 rounded-xl object-cover border border-[rgba(212,175,55,0.35)] bg-[#10131c]"
      />
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className="block text-[11px] tracking-[0.28em] text-gold">UNIDADE</span>
          <span className="block truncate text-lg font-semibold">{shopName}</span>
        </span>
      )}
    </Link>
  );
}

export function ShopBackdrop({
  slug,
  brandAt,
  children,
  className,
  contentClassName,
}: {
  slug: string;
  brandAt?: Date | string | null;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const src = brandUrl(slug, brandAt);
  return (
    <div
      className={cn("relative min-h-screen", src ? "shop-brand-bg" : "grid-bg", className)}
      style={src ? { backgroundImage: `url("${src}")` } : undefined}
    >
      {src ? <div className="shop-brand-veil" aria-hidden /> : null}
      <div className={cn("relative z-[1] min-h-screen", contentClassName)}>{children}</div>
    </div>
  );
}
