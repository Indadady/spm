"use client";

import { buttonVariants } from "@/components/ui/button";
import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import { FileText, LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "지급", icon: LayoutGrid },
  { href: "/ledger", label: "세무 자료", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path.startsWith("/p/");

  if (bare) {
    return <div className="min-h-full bg-[#f4f7f6] print:bg-white">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card text-[color:var(--navy)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={COMPANY_LOGO} alt={COMPANY.name} className="h-7 w-auto shrink-0" />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold tracking-wider text-[color:var(--gold-ink)]">
                SPM
              </span>
              <span className="block truncate text-sm font-bold leading-tight">스마트파트너 관리</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 sm:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "text-[color:var(--navy)]/80 hover:bg-black/5 hover:text-[color:var(--navy)]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/payouts/new"
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-[color:var(--gold)] text-[color:var(--navy)] hover:bg-[color:var(--gold)]/90"
              )}
            >
              <Plus className="size-4" />
              새 지급
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-24 sm:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <Link
            href="/payouts/new"
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-[color:var(--navy)]"
          >
            <Plus className="size-4" />
            새 지급
          </Link>
        </div>
      </nav>
    </div>
  );
}
