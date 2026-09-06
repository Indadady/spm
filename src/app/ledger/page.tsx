"use client";

import { CopyButton } from "@/components/copy-button";
import { useStore } from "@/lib/store";
import { taxMemoFor } from "@/lib/tax";
import Link from "next/link";

export default function LedgerPage() {
  const { payouts, ready, payeeOf } = useStore();
  const outgoing = payouts.filter((p) => p.side === "out");
  const memos = outgoing.map((p) => ({
    p,
    memo: taxMemoFor(p, payeeOf(p.id)),
  }));
  const all = memos.map((row) => row.memo).join("\n\n");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">세무 자료</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            세무 담당자에게 보낼 글입니다. 계좌가 비어 있으면 아직 자료를 받지 못한 건입니다.
          </p>
        </div>
        {all ? <CopyButton text={all} label="전체 복사" /> : null}
      </div>
      {!ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : memos.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 지급 건이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {memos.map(({ p, memo }) => (
            <li key={p.id} className="rounded-2xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Link href={`/payouts/${p.id}`} className="text-sm font-semibold underline">
                  {p.partnerName}
                </Link>
                <CopyButton text={memo} label="복사" />
              </div>
              <pre className="whitespace-pre-wrap break-keep text-sm leading-relaxed">{memo}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
