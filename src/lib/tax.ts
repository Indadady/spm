import type { TaxMethod } from "./types";

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
      notes: [
        "사업자등록 거래입니다. 공급가액에 부가세 10%를 별도 수취·공제합니다.",
        "원천징수는 하지 않고, 세금계산서와 이체증을 원장에 붙입니다.",
      ],
    };
  }

  if (input.method === "business-3-3") {
    const incomeTax = floorWon(gross * 0.03);
    const localTax = floorWon(incomeTax * 0.1);
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
      notes: [
        "법인에서 개인에게 나가는 지출은 사업소득으로 보고 3.3%를 원천합니다.",
        "소득세 3% + 지방소득세 0.3%를 뺀 금액을 본인 명의 계좌로 이체합니다.",
      ],
    };
  }

  if (input.method === "other-income-60") {
    const expense = floorWon(gross * 0.6);
    const taxable = gross - expense;
    const notes = [
      "강연료·자문료 등 기타소득(인적용역)은 필요경비 60%를 뺀 금액에 20%를 원천징수합니다.",
      "지방소득세는 소득세의 10%입니다. 합치면 지급액의 8.8%입니다.",
    ];
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
        notes: [
          ...notes,
          "기타소득금액이 5만 원 이하이면 과세최저한으로 원천징수하지 않습니다.",
        ],
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
    notes: ["세액을 회계 프로그램에서 계산한 뒤, 이 건의 메모에 적어 두세요."],
  };
}
