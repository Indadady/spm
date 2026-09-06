"use client";

import { PayeeForm } from "@/components/payee-form";
import { COMPANY, COMPANY_LOGO } from "@/lib/company";
import { formatWon } from "@/lib/format";
import { usePayout, useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import { useParams } from "next/navigation";

export default function PublicPayeePage() {
  const { id } = useParams<{ id: string }>();
  const payout = usePayout(id);
  const { ready } = useStore();

  if (!payout || payout.side !== "out") {
    if (!ready) {
      return <p className="text-sm text-muted-foreground">불러오는 중…</p>;
    }
    return (
      <div className="mx-auto max-w-[800px] px-3 py-8">
        <h1 className="text-xl font-bold">링크를 확인하세요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          해당하는 지출 건이 없습니다. 투어메이커에서 받은 주소를 다시 열어 주세요.
        </p>
      </div>
    );
  }

  const tax = calcTax({ method: payout.taxMethod, gross: payout.gross });

  return (
    <article className="spm-doc mx-auto my-4 max-w-[800px] overflow-hidden rounded-xl border bg-white shadow-sm print:my-0 print:border-0 print:shadow-none">
      <header className="border-b px-5 py-6 text-center sm:px-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COMPANY_LOGO} alt="TOURMAKER" className="mx-auto mb-3 h-10 w-auto" />
        <p className="text-xs font-semibold tracking-[0.16em] text-[color:var(--gold-ink)]">
          {COMPANY.name}
        </p>
        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-[color:var(--navy)] sm:text-2xl">
          스마트 파트너십 정산 자료
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {payout.eventName ?? payout.title}
          {payout.documentNo ? ` · ${payout.documentNo}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          총액 {formatWon(tax.gross)} · 원천 3.3% {formatWon(tax.withholding)} · 입금 예정{" "}
          {formatWon(tax.net)}
        </p>
      </header>
      <div className="px-5 py-5 sm:px-7">
        <PayeeForm payout={payout} />
      </div>
      <footer className="border-t bg-[#f8f9fa] px-5 py-3 text-center text-xs text-muted-foreground">
        [System Powered by TOURMAKER] 구글폼·외부 전자계약 없이 투어메이커 자체 화면에서 제출합니다.
        <br />
        <a href="https://tourmaker.kr" className="font-semibold text-[color:var(--navy)]">
          tourmaker.kr
        </a>
      </footer>
    </article>
  );
}
