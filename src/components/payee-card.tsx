"use client";

import { CopyButton } from "@/components/copy-button";
import { DocImage } from "@/components/doc-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InboxStatus } from "@/lib/payee-inbox";
import type { PayeeProfile, Payout } from "@/lib/types";

export function PayeeCard({
  payout,
  payee,
  status,
}: {
  payout: Payout;
  payee?: PayeeProfile;
  status?: InboxStatus;
}) {
  const idSrc = payee?.idImageUrl || payee?.idImageDataUrl;
  const passSrc = payee?.passportImageUrl || payee?.passportImageDataUrl;
  const got = Boolean(payee?.name || payee?.bank || payee?.rrn);

  return (
    <Card>
      <CardHeader>
        <CardTitle>받는 사람 정보</CardTitle>
        <p className="text-xs text-muted-foreground">
          {got
            ? "제출받은 자료입니다. 신분증·여권 사진은 아래에서 확인할 수 있습니다."
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
            <dd className="flex flex-wrap items-center gap-2 font-medium tabular-nums">
              <span>{payee.rrn || "—"}</span>
              {payee.rrn ? <CopyButton text={payee.rrn} label="복사" /> : null}
            </dd>
            {payout.collectInsurance ? (
              <>
                <dt className="text-muted-foreground">여행자보험</dt>
                <dd>{payee.rrn ? "주민번호 제출" : "미제출"}</dd>
              </>
            ) : null}
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
            {payee.passportName ? (
              <>
                <dt className="text-muted-foreground">영문 성명</dt>
                <dd>{payee.passportName}</dd>
              </>
            ) : null}
            {payee.passportNo ? (
              <>
                <dt className="text-muted-foreground">여권번호</dt>
                <dd className="tabular-nums">{payee.passportNo}</dd>
              </>
            ) : null}
          </dl>
        )}
        {payee?.signatureDataUrl ? (
          <DocImage src={payee.signatureDataUrl} label="서명" />
        ) : null}
        {payee ? (
          <DocImage
            src={idSrc}
            label="신분증 사본"
            empty="신분증 사본이 아직 없습니다. 같은 링크를 다시 보내 사진을 받으면 여기에 보입니다."
          />
        ) : null}
        {payout.collectPassport || passSrc ? (
          <DocImage src={passSrc} label="여권사본" empty="여권사본이 아직 없습니다." />
        ) : null}
      </CardContent>
    </Card>
  );
}
