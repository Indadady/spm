"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPM_INBOX_FOLDER_URL, SPM_LEDGER_SHEET_URL } from "@/lib/drive-inbox";
import type { InboxStatus } from "@/lib/payee-inbox";
import { payeeReady } from "@/lib/payout-types";
import type { PayeeProfile, Payout } from "@/lib/types";

const statusText: Record<InboxStatus, string> = {
  connecting: "드라이브 받은자료 폴더를 확인하는 중…",
  live: "제출되면 구글 드라이브 받은자료 폴더에만 보관됩니다.",
  local: "이 웹페이지에는 주민번호·계좌·신분증을 남기지 않습니다.",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>받는 사람 정보</CardTitle>
        <p className="text-xs text-muted-foreground">
          {ready
            ? "상대가 제출한 개인정보는 구글 드라이브 받은자료 폴더에 있습니다."
            : status
              ? statusText[status]
              : "링크를 보내 제출을 기다립니다."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {ready && payee ? (
          <p className="leading-relaxed">
            <span className="font-medium">{payee.name}</span> 님이 제출했습니다. 주민등록번호,
            계좌, 신분증, 서명은 이 공개 웹페이지에 보이지 않습니다.
          </p>
        ) : (
          <p className="text-muted-foreground">
            {payout.partnerName}에게 링크를 보내면 성명·주민등록번호·신분증·본인 계좌를 받아, 내
            드라이브 <span className="font-medium">5.spm / 받은자료</span> 폴더에 넣습니다.
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={SPM_INBOX_FOLDER_URL} target="_blank" rel="noreferrer" className="underline">
            받은자료 폴더 열기
          </a>
          <a href={SPM_LEDGER_SHEET_URL} target="_blank" rel="noreferrer" className="underline">
            받은자료 대장 열기
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
