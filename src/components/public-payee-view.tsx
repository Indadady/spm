"use client";

import { PayeeForm } from "@/components/payee-form";
import { PublicSiteLink } from "@/components/public-site-link";
import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import { usePublicPayout } from "@/lib/use-public-payout";

export function PublicPayeeView({ id }: { id: string }) {
  const { payout, ready } = usePublicPayout(id);

  if (!id || !payout || payout.side !== "out") {
    if (!ready) {
      return <p className="p-6 text-sm text-muted-foreground">불러오는 중…</p>;
    }
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-[color:var(--navy)]">링크를 확인하세요</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          투어메이커에서 받은 주소를 다시 열어 주세요.
        </p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-md px-4 py-8">
      <div className="rounded-3xl border border-[color:var(--border)] bg-card px-5 py-7 shadow-[0_10px_30px_rgba(15,44,68,0.06)]">
        <header className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COMPANY_LOGO} alt={COMPANY.name} className="mx-auto h-8 w-auto" />
          <p className="mt-3 text-[11px] font-semibold tracking-[0.18em] text-[color:var(--gold-ink)]">
            TOURMAKER
          </p>
          <h1 className="mt-1 text-xl font-bold text-[color:var(--navy)]">입금 정보</h1>
          <div className="mx-auto mt-3 h-px w-12 bg-[color:var(--gold)]" />
          {payout.collectInsurance || payout.collectPassport ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {[payout.collectInsurance ? "여행자보험" : null, payout.collectPassport ? "여권사본" : null]
                .filter(Boolean)
                .join("·")}{" "}
              자료도 함께 받습니다.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              이체에 필요한 정보만 입력해 주세요. 금액은 보이지 않습니다.
            </p>
          )}
        </header>
        <PayeeForm payout={payout} />
      </div>
      <PublicSiteLink />
    </article>
  );
}
