"use client";

import { buttonVariants } from "@/components/ui/button";
import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import { withBase } from "@/lib/paths";
import { Archive, ClipboardList, FileText, LayoutGrid, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "홈", icon: LayoutGrid },
  { href: "/collect", label: "여행자", icon: ClipboardList },
  { href: "/ledger", label: "세무", icon: FileText },
  { href: "/archive", label: "보관함", icon: Archive },
];

function navHref(path: string) {
  if (path === "/") return withBase("/");
  return withBase(path.endsWith("/") ? path : `${path}/`);
}

function pathActive(current: string, href: string) {
  const now = current.endsWith("/") && current !== "/" ? current.slice(0, -1) : current;
  if (href === "/") return now === "/" || now === "";
  return now === href || now.startsWith(`${href}/`);
}

function goHard(e: React.MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  window.location.assign(e.currentTarget.href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const bare = path.startsWith("/p/") || path.startsWith("/g/");
  const onCollect = path.startsWith("/collect");
  const createHref = navHref(onCollect ? "/collect/new" : "/payouts/new");
  const createLabel = onCollect ? "새 링크" : "새 지급";

  if (bare) {
    return <div className="min-h-full bg-[#f6f1e8] print:bg-white">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-[color:var(--gold)]/50 bg-[color:var(--navy)] text-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <a href={navHref("/")} onClick={goHard} className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={COMPANY_LOGO}
              alt={COMPANY.name}
              className="h-7 w-auto shrink-0 brightness-0 invert"
            />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold tracking-[0.16em] text-[color:var(--gold)]">
                TOURMAKER
              </span>
              <span className="block truncate text-sm font-bold leading-tight">자료모우기</span>
            </span>
          </a>
          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-0.5 sm:flex">
              {nav.map((item) => {
                const active = pathActive(path, item.href);
                return (
                  <a
                    key={item.href}
                    href={navHref(item.href)}
                    onClick={goHard}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "sm" }),
                      active
                        ? "bg-white/12 font-semibold text-white"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <a
              href={createHref}
              onClick={goHard}
              className={cn(
                buttonVariants({ size: "sm" }),
                "bg-[color:var(--gold)] text-[color:var(--navy)] hover:bg-[color:var(--gold)]/90"
              )}
            >
              <Plus className="size-4" />
              {createLabel}
            </a>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 sm:py-8 sm:pb-10">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--border)] bg-[color:var(--card)]/95 backdrop-blur sm:hidden">
        <div className="grid grid-cols-4">
          {nav.map((item) => {
            const active = pathActive(path, item.href);
            return (
              <a
                key={item.href}
                href={navHref(item.href)}
                onClick={goHard}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "font-semibold text-[color:var(--navy)]" : "text-muted-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
