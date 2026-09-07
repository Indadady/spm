"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function CollectExtras({
  insurance,
  passport,
  onChange,
}: {
  insurance: boolean;
  passport: boolean;
  onChange: (next: { collectInsurance: boolean; collectPassport: boolean }) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>추가로 받을 자료</Label>
      <p className="text-xs leading-relaxed text-muted-foreground">
        입금용 성명·주민번호·신분증·계좌는 기본입니다. 여행자보험은 같은 주민번호를 쓰고, 여권사본은
        사진을 더 받습니다.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={cn(
            "rounded-2xl border px-4 py-3 text-left",
            insurance ? "border-[color:var(--navy)] bg-accent/70" : "bg-card"
          )}
          onClick={() => onChange({ collectInsurance: !insurance, collectPassport: passport })}
        >
          <p className="font-semibold">여행자보험</p>
          <p className="mt-0.5 text-xs text-muted-foreground">주민번호 가입용</p>
        </button>
        <button
          type="button"
          className={cn(
            "rounded-2xl border px-4 py-3 text-left",
            passport ? "border-[color:var(--navy)] bg-accent/70" : "bg-card"
          )}
          onClick={() => onChange({ collectInsurance: insurance, collectPassport: !passport })}
        >
          <p className="font-semibold">여권사본</p>
          <p className="mt-0.5 text-xs text-muted-foreground">여행자 명단용 사진</p>
        </button>
      </div>
    </div>
  );
}
