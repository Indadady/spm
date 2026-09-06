"use client";

import { TypeBadge } from "@/components/type-badge";
import { formatDate, formatWon } from "@/lib/format";
import { PAYOUT_TYPES } from "@/lib/payout-types";
import { useStore } from "@/lib/store";
import { calcTax } from "@/lib/tax";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function LedgerPage() {
  const { payouts, ready } = useStore();
  const rows = payouts.map((p) => {
    const tax = calcTax({ method: p.taxMethod, gross: p.gross, days: p.days });
    const type = PAYOUT_TYPES.find((t) => t.id === p.typeId)!;
    return { p, tax, type };
  });
  const out = rows.filter((r) => r.p.side === "out");
  const inn = rows.filter((r) => r.p.side === "in");
  const sumW = out.reduce((a, r) => a + r.tax.withholding, 0);
  const sumN = out.reduce((a, r) => a + r.tax.net, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">원장</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          법인 지출은 발주처 금액에서 3.3%를 뺀 이체액이 실제 나갑니다. 참고 수입은 따로 둡니다.
        </p>
      </div>
      {payouts.length === 0 && !ready ? (
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      ) : (
        <>
          <p className="text-sm">
            법인 이체 {formatWon(sumN)} · 원천세 {formatWon(sumW)}
          </p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>구분</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>건</TableHead>
                  <TableHead>상대</TableHead>
                  <TableHead className="text-right">총액</TableHead>
                  <TableHead className="text-right">원천</TableHead>
                  <TableHead className="text-right">실지급</TableHead>
                  <TableHead>예정일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ p, tax, type }) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.side === "in" ? "참고" : "지출"}</TableCell>
                    <TableCell>
                      <TypeBadge id={p.typeId} name={type.name} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/payouts/${p.id}`} className="underline">
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell>{p.partnerName}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatWon(tax.gross)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatWon(tax.withholding)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatWon(tax.net)}</TableCell>
                    <TableCell>{formatDate(p.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {inn.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              참고 수입은 대표 개인이 다른 사업자에게 받은 건입니다. 법인 손금과 섞지 마세요.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
