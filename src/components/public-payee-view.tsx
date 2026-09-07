"use client";

import { PayeeForm } from "@/components/payee-form";
import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import { usePayout, useStore } from "@/lib/store";

export function PublicPayeeView({ id }: { id: string }) {
  const payout = usePayout(id);
  const { ready } = useStore();

  if (!id || !payout || payout.side !== "out") {
    if (!ready) {
      return <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>;
    }
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-xl font-bold">링크를 확인하세요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          투어메이커에서 받은 주소를 다시 열어 주세요.
        </p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-md px-4 py-6">
      <header className="mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COMPANY_LOGO} alt={COMPANY.name} className="h-8 w-auto" />
        <h1 className="mt-3 text-lg font-bold text-[color:var(--navy)]">입금 정보</h1>
      </header>
      <PayeeForm payout={payout} />
    </article>
  );
}
