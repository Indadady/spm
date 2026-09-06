import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Payout } from "@/lib/types";
import Link from "next/link";

export function PayoutSubnav({ payout }: { payout: Payout }) {
  const items = [
    { href: `/payouts/${payout.id}`, label: "개요" },
    { href: `/payouts/${payout.id}/contract`, label: "계약" },
    { href: `/payouts/${payout.id}/survey`, label: "설문" },
    { href: `/payouts/${payout.id}/rooms`, label: "객실" },
    { href: `/payouts/${payout.id}/schedule`, label: "일정" },
  ];

  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0"
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
