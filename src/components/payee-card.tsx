import { maskRrn } from "@/lib/format";
import type { InboxStatus } from "@/lib/payee-inbox";
import { payeeReady } from "@/lib/payout-types";
import type { PayeeProfile, Payout } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PayeeCard({
  payout,
  payee,
  status,
}: {
  payout: Payout;
  payee?: PayeeProfile;
  status?: InboxStatus;
}) {
  const ready = payeeReady(payee);
  const idSrc = payee?.idImageUrl || payee?.idImageDataUrl;

  return (
    <Card>
      <CardHeader>
        <CardTitle>받는 사람 정보</CardTitle>
        <p className="text-xs text-muted-foreground">
          {ready
            ? "제출받은 이체 정보입니다."
            : status === "connecting"
              ? "자료함에 연결하는 중…"
              : "링크를 보내 제출을 기다립니다."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!payee ? (
          <p className="text-muted-foreground">
            {payout.partnerName}에게 링크를 보내면 성명·주민등록번호·신분증·계좌가 여기에 모입니다.
          </p>
        ) : (
          <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5">
            <dt className="text-muted-foreground">이름</dt>
            <dd className="font-medium">{payee.name}</dd>
            <dt className="text-muted-foreground">주민등록번호</dt>
            <dd className="font-medium tabular-nums">{maskRrn(payee.rrn)}</dd>
            {payee.phone ? (
              <>
                <dt className="text-muted-foreground">휴대전화</dt>
                <dd>{payee.phone}</dd>
              </>
            ) : null}
            <dt className="text-muted-foreground">은행</dt>
            <dd>{payee.bank}</dd>
            <dt className="text-muted-foreground">계좌</dt>
            <dd className="tabular-nums">{payee.account}</dd>
            <dt className="text-muted-foreground">예금주</dt>
            <dd>{payee.holder}</dd>
          </dl>
        )}
        {payee?.signatureDataUrl ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">서명</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={payee.signatureDataUrl}
              alt="서명"
              className="max-h-28 w-full rounded-xl border bg-white object-contain"
            />
          </div>
        ) : null}
        {idSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={idSrc}
            alt="신분증"
            className="max-h-56 w-full rounded-xl border bg-white object-contain"
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
