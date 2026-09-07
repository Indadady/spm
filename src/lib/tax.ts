import type { PayeeProfile, Payout, TaxMethod } from "./types";
import { formatPayDate } from "./format";

export type TaxResult = {
  method: TaxMethod;
  methodLabel: string;
  gross: number;
  expense: number;
  taxable: number;
  incomeTax: number;
  localTax: number;
  withholding: number;
  net: number;
  notes: string[];
};

function floorWon(n: number) {
  return Math.floor(Math.max(0, n));
}

function floor10(n: number) {
  return Math.floor(Math.max(0, n) / 10) * 10;
}

export function formatWonPlain(n: number) {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

export function calcTax(input: {
  method: TaxMethod;
  gross: number;
  days?: number;
}): TaxResult {
  const gross = Math.max(0, Math.round(input.gross || 0));

  if (input.method === "tax-invoice") {
    return {
      method: input.method,
      methodLabel: "세금계산서 (원천징수 없음)",
      gross,
      expense: 0,
      taxable: gross,
      incomeTax: 0,
      localTax: 0,
      withholding: 0,
      net: gross,
      notes: ["사업자등록 거래는 원천징수 없이 세금계산서로 처리합니다."],
    };
  }

  if (input.method === "business-3-3") {
    const incomeTax = floor10(gross * 0.03);
    const localTax = floor10(incomeTax * 0.1);
    const withholding = incomeTax + localTax;
    return {
      method: input.method,
      methodLabel: "사업소득 원천징수 3.3%",
      gross,
      expense: 0,
      taxable: gross,
      incomeTax,
      localTax,
      withholding,
      net: gross - withholding,
      notes: ["소득세 3%와 지방소득세 0.3%를 적용한 뒤 10원 미만을 버립니다."],
    };
  }

  if (input.method === "other-income-60") {
    const expense = floorWon(gross * 0.6);
    const taxable = gross - expense;
    const notes = ["기타소득은 필요경비 60%를 뺀 금액에 원천합니다."];
    if (taxable <= 50_000) {
      return {
        method: input.method,
        methodLabel: "기타소득 (필요경비 60%)",
        gross,
        expense,
        taxable,
        incomeTax: 0,
        localTax: 0,
        withholding: 0,
        net: gross,
        notes,
      };
    }
    const incomeTax = floorWon(taxable * 0.2);
    const localTax = floorWon(incomeTax * 0.1);
    return {
      method: input.method,
      methodLabel: "기타소득 (필요경비 60%)",
      gross,
      expense,
      taxable,
      incomeTax,
      localTax,
      withholding: incomeTax + localTax,
      net: gross - incomeTax - localTax,
      notes,
    };
  }

  return {
    method: input.method,
    methodLabel: "직접 입력",
    gross,
    expense: 0,
    taxable: gross,
    incomeTax: 0,
    localTax: 0,
    withholding: 0,
    net: gross,
    notes: [],
  };
}

export function formatTaxMemo(input: {
  gross: number;
  withholding: number;
  net: number;
  bank?: string;
  account?: string;
  holder?: string;
  payDate: string;
  rrn?: string;
  insurance?: boolean;
  passportSubmitted?: boolean;
  passportName?: string;
  passportNo?: string;
}) {
  const payLine = [input.bank, input.account, input.holder].filter(Boolean).join(" ");
  const last = payLine
    ? `최종 입금 예정 금액: ${formatWonPlain(input.net)}        ${payLine} 지급일 ${input.payDate}`
    : `최종 입금 예정 금액: ${formatWonPlain(input.net)}        지급일 ${input.payDate}`;
  const lines = [
    `세전 ${formatWonPlain(input.gross)}`,
    `사업소득세 원천징수(3.3%) 적용: ${formatWonPlain(input.withholding)} (1원 단위 절사)`,
    last,
  ];
  if (input.rrn) {
    lines.push(`주민등록번호: ${input.rrn}${input.insurance ? " (여행자보험)" : ""}`);
  }
  if (input.passportSubmitted) {
    const pass = ["여권사본: 제출", input.passportName, input.passportNo].filter(Boolean);
    lines.push(pass.join(" · "));
  }
  return lines.join("\n");
}

export function taxMemoFor(payout: Payout, payee?: PayeeProfile) {
  const tax = calcTax({ method: payout.taxMethod, gross: payout.gross, days: payout.days });
  const passportSubmitted = Boolean(payee?.passportImageUrl || payee?.passportImageDataUrl);
  return formatTaxMemo({
    gross: tax.gross,
    withholding: tax.withholding,
    net: tax.net,
    bank: payee?.bank,
    account: payee?.account,
    holder: payee?.holder,
    payDate: formatPayDate(payout.paidDate || payout.dueDate),
    rrn: payee?.rrn,
    insurance: Boolean(payout.collectInsurance && payee?.rrn),
    passportSubmitted,
    passportName: payee?.passportName,
    passportNo: payee?.passportNo,
  });
}
