import Link from "next/link";
import { Logo } from "./ui";
import { LogoutButton } from "./logout-button";
import { cn } from "@/lib/utils";

export function AppShell({
  title,
  subtitle,
  nav,
  children,
  homeHref = "/",
  logoutHref = "/login",
}: {
  title: string;
  subtitle: string;
  nav: { href: string; label: string; active?: boolean }[];
  children: React.ReactNode;
  homeHref?: string;
  logoutHref?: string;
}) {
  return (
    <div className="grid-bg min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[rgba(212,175,55,0.14)] p-5 lg:border-b-0 lg:border-r">
          <Logo href={homeHref} />
          <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-[#8b93a7]">{subtitle}</p>
          <nav className="mt-4 grid gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm transition",
                  item.active ? "bg-[rgba(212,175,55,0.12)] text-gold" : "text-[#c6ccda] hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <LogoutButton href={logoutHref} />
          </div>
        </aside>
        <main className="p-5 lg:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <div className="gold-line mt-4 mb-8" />
          {children}
        </main>
      </div>
    </div>
  );
}
