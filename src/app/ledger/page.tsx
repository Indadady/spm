"use client";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { wipePayoutRemote } from "@/lib/delete-payout";
import { deletePayeeSubmissions } from "@/lib/payee-inbox";
import { useStore } from "@/lib/store";
import { taxMemoFor } from "@/lib/tax";
import Link from "next/link";
import { useState } from "react";

export default function LedgerPage() {
  const { payouts, ready, payeeOf, removePayout, clearPayee } = useStore();
  const [deletingId, setDeletingId] = useState("");
  const [clearingPayeeId, setClearingPayeeId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const outgoing = payouts.filter((p) => p.side === "out");
  const memos = outgoing.map((p) => ({
    p,
    memo: taxMemoFor(p, payeeOf(p.id)),
    payee: payeeOf(p.id),
  }));
  const all = memos.map((row) => row.memo).join("\n\n");
  const busy = Boolean(deletingId) || Boolean(clearingPayeeId) || clearing;

  async function wipeOne(id: string) {
    await wipePayoutRemote(id);
    removePayout(id);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">세무 자료</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            세무 담당자에게 보낼 글입니다. 계좌가 비어 있으면 아직 자료를 받지 못한 건입니다.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {all ? <CopyButton text={all} label="전체 복사" /> : null}
          {memos.length > 0 ? (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!window.confirm("세무 자료를 모두 삭제할까요? 되돌릴 수 없습니다.")) return;
                setClearing(true);
                setError("");
                try {
                  for (const { p } of memos) {
                    await wipeOne(p.id);
                  }
                } catch {
                  setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
                } finally {
                  setClearing(false);
                }
              }}
            >
              {clearing ? "지우는 중…" : "전체 삭제"}
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {!ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : memos.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 지급 건이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {memos.map(({ p, memo, payee }) => (
            <li key={p.id} className="rounded-2xl border bg-card p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Link href={`/payouts/${p.id}`} className="text-sm font-semibold underline">
                  {p.partnerName}
                </Link>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <CopyButton text={memo} label="복사" />
                  {payee ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          !window.confirm(
                            `${payee.name || p.partnerName} 받은 세무 자료를 삭제할까요? 지급 건과 링크는 그대로입니다.`
                          )
                        )
                          return;
                        setClearingPayeeId(p.id);
                        setError("");
                        try {
                          await deletePayeeSubmissions(p.id);
                          clearPayee(p.id);
                        } catch {
                          setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
                        } finally {
                          setClearingPayeeId("");
                        }
                      }}
                    >
                      {clearingPayeeId === p.id ? "지우는 중…" : "받은 자료 삭제"}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm(`${p.partnerName} 세무 자료를 삭제할까요? 되돌릴 수 없습니다.`))
                        return;
                      setDeletingId(p.id);
                      setError("");
                      try {
                        await wipeOne(p.id);
                      } catch {
                        setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
                      } finally {
                        setDeletingId("");
                      }
                    }}
                  >
                    {deletingId === p.id ? "지우는 중…" : "삭제"}
                  </Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap break-keep text-sm leading-relaxed">{memo}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
