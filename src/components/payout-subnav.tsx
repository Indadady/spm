import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Payout } from "@/lib/types";
import Link from "next/link";

export function PayoutSubnav({ payout }: { payout: Payout }) {
  const items = [
    { href: `/payouts/${payout.id}`, label: "개요" },
    ...(payout.side === "out"
      ? [{ href: `/payouts/${payout.id}/payee`, label: "받은 자료" }]
      : []),
    ...(payout.contract || payout.needsContract
      ? [{ href: `/payouts/${payout.id}/contract`, label: "계약" }]
      : []),
    ...(payout.side === "in" && payout.survey.length > 0
      ? [{ href: `/payouts/${payout.id}/survey`, label: "참고 설문" }]
      : []),
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
