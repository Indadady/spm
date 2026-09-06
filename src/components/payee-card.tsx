import { formatWon, maskRrn } from "@/lib/format";
import { payeeReady } from "@/lib/payout-types";
import type { PayeeProfile, Payout } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PayeeCard({
  payout,
  payee,
}: {
  payout: Payout;
  payee?: PayeeProfile;
}) {
  const ready = payeeReady(payee);

  return (
    <Card>
      <CardHeader>
        <CardTitle>이체용 인적정보</CardTitle>
        <p className="text-xs text-muted-foreground">
          {ready
            ? "이름·주민등록번호·신분증·본인 계좌를 받았습니다."
            : "아직 받는 중입니다. 아래 링크를 보내 주세요."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!payee ? (
          <p className="text-muted-foreground">
            {payout.partnerName}에게 링크를 보내 성명, 주민등록번호, 신분증, 본인 명의 계좌를
            받습니다.
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
        {payee?.idImageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={payee.idImageDataUrl}
            alt="신분증"
            className="max-h-56 w-full rounded-xl border object-contain bg-white"
          />
        ) : null}
        {payout.gross > 0 ? (
          <p className="text-xs text-muted-foreground">
            발주처 금액 {formatWon(payout.gross)}에서 3.3%를 뺀 뒤 위 계좌로 이체합니다.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
