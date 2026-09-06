import { formatWon, maskRrn } from "@/lib/format";
import type { InboxStatus } from "@/lib/payee-inbox";
import { payeeReady } from "@/lib/payout-types";
import type { PayeeProfile, Payout } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusText: Record<InboxStatus, string> = {
  connecting: "만족도 설문과 같은 자료함에 연결하는 중…",
  live: "제출되면 이 화면에 바로 보입니다.",
  local: "지금 미리보기에서는 이 기기 저장만 보입니다. 배포 주소에서는 파이어베이스로 받습니다.",
};

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
        <CardTitle>이체용 인적정보</CardTitle>
        <p className="text-xs text-muted-foreground">
          {ready
            ? payee?.source === "firebase"
              ? "상대가 제출한 자료를 자료함에서 받았습니다."
              : "이름·주민등록번호·신분증·본인 계좌를 받았습니다."
            : status
              ? statusText[status]
              : "링크를 보내 제출을 기다립니다."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!payee ? (
          <p className="text-muted-foreground">
            {payout.partnerName}에게 링크를 보내면, 카톡이나 구두 대신 여기서 성명·주민등록번호·신분증·본인
            계좌를 모읍니다.
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
        {idSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={idSrc}
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
