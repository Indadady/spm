"use client";

import { buttonVariants } from "@/components/ui/button";
import { FolderOpen, Landmark, LayoutGrid, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "현황", icon: LayoutGrid },
  { href: "/ledger", label: "원장", icon: Landmark },
  { href: "/collect", label: "자료함", icon: FolderOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path.startsWith("/p/");

  if (bare) {
    return (
      <div className="flex min-h-full flex-col bg-background">
        <header className="border-b border-white/10 bg-[color:var(--navy)] text-white">
          <div className="mx-auto max-w-lg px-4 py-3">
            <p className="text-sm font-bold">주식회사 투어메이커</p>
            <p className="text-xs text-white/70">지출 자료 수집</p>
          </div>
        </header>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-[color:var(--navy)] text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight">SPM</span>
            <span className="truncate text-xs font-medium text-white/70">
              스마트파트너쉽관리
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
                    "text-white/85 hover:bg-white/10 hover:text-white"
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
              새 지출
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 pb-24 sm:pb-8">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
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
            새 지출
          </Link>
        </div>
      </nav>
      <footer className="hidden border-t py-4 text-center text-xs text-muted-foreground sm:block">
        (주)투어메이커 · 법인 지출은 사업소득 3.3% 원천 후 이체합니다.
      </footer>
    </div>
  );
}
