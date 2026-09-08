"use client";

import { CopyLink } from "@/components/copy-link";
import { PayeeCard } from "@/components/payee-card";
import { TaxCard } from "@/components/tax-card";
import { Button } from "@/components/ui/button";
import { collectSharePath } from "@/lib/company";
import { wipePayoutRemote } from "@/lib/delete-payout";
import { formatPayDate, payDateIso } from "@/lib/format";
import { absoluteUrl } from "@/lib/paths";
import { deletePayeeSubmissions } from "@/lib/payee-inbox";
import { loadPayoutMeta, payoutFromMeta, publishPayoutMeta } from "@/lib/payout-meta";
import { usePayout, useStore } from "@/lib/store";
import { usePayeeInbox } from "@/lib/use-payee-inbox";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PayoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const payout = usePayout(id);
  const { setStatus, ready, removePayout, clearPayee, addPayout } = useStore();
  const inbox = usePayeeInbox(id);
  const [collectUrl, setCollectUrl] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [clearingPayee, setClearingPayee] = useState(false);
  const [error, setError] = useState("");
  const [looking, setLooking] = useState(true);
  useEffect(() => {
    setCollectUrl(absoluteUrl(collectSharePath(id)));
  }, [id]);
  useEffect(() => {
    if (!ready) return;
    if (payout || !id) {
      setLooking(false);
      return;
    }
    let cancelled = false;
    setLooking(true);
    loadPayoutMeta(id)
      .then((meta) => {
        if (!cancelled && meta) addPayout(payoutFromMeta(meta));
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLooking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [addPayout, id, payout, ready]);
  useEffect(() => {
    if (!payout || payout.side !== "out") return;
    void publishPayoutMeta({
      ...payout,
      collectInsurance: false,
      collectPassport: false,
    });
  }, [payout, payout?.id, payout?.dueDate]);

  if (!payout) {
    return (
      <p className="text-sm text-muted-foreground">
        {ready && !looking
          ? "해당 건을 찾을 수 없습니다. 보관함의 예전 링크 복원에 주소를 붙여 넣어 보세요."
          : "불러오는 중…"}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-muted-foreground">
        ← 지급
      </Link>
      <div>
        <h1 className="text-2xl font-bold leading-tight">{payout.partnerName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {payout.eventName || payout.title}
          {" · "}지급일 {formatPayDate(payDateIso(payout))}
          {payout.status === "paid" ? " · 이체 완료" : ""}
        </p>
      </div>

      {payout.side === "out" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">자료 받는 링크</p>
            <p className="truncate text-xs text-muted-foreground">
              {collectUrl || "주소를 만드는 중…"}
            </p>
          </div>
          {collectUrl ? (
            <CopyLink payoutId={payout.id} onCopied={setCollectUrl} />
          ) : null}
        </div>
      ) : null}

      <TaxCard payout={payout} payee={inbox.payee} />

      {payout.side === "out" ? (
        <PayeeCard payout={payout} payee={inbox.payee} status={inbox.status} />
      ) : null}

      {payout.side === "out" && payout.status !== "paid" ? (
        <Button
          className="w-full sm:w-auto"
          onClick={() => setStatus(payout.id, "paid", payDateIso(payout))}
        >
          이체 완료
        </Button>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {payout.side === "out" && inbox.payee ? (
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={deleting || clearingPayee}
          onClick={async () => {
            if (
              !window.confirm(
                `${inbox.payee?.name || payout.partnerName} 받은 세무 자료를 삭제할까요? 지급 건과 링크는 그대로입니다.`
              )
            )
              return;
            setClearingPayee(true);
            setError("");
            try {
              await deletePayeeSubmissions(payout.id);
              clearPayee(payout.id);
            } catch {
              setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
            } finally {
              setClearingPayee(false);
            }
          }}
        >
          {clearingPayee ? "지우는 중…" : "받은 자료 삭제"}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        className="w-full sm:w-auto"
        disabled={deleting}
        onClick={async () => {
          if (!window.confirm(`${payout.partnerName} 세무 자료를 삭제할까요? 되돌릴 수 없습니다.`))
            return;
          setDeleting(true);
          setError("");
          try {
            await wipePayoutRemote(payout.id);
            removePayout(payout.id);
            router.push("/");
          } catch {
            setError("지우지 못했습니다. 연결을 확인하고 다시 시도해 주세요.");
            setDeleting(false);
          }
        }}
      >
        {deleting ? "지우는 중…" : "삭제"}
      </Button>
    </div>
  );
}
