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
  const days = Math.max(1, input.days ?? 1);

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
        "사업자등록이 없는 개인(프리랜서)에게 용역비를 지급할 때 씁니다.",
        "소득세 3% + 지방소득세 0.3%를 원천징수한 뒤 다음 달 10일까지 신고·납부합니다.",
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

  if (input.method === "daily-wage") {
    const daily = floorWon(gross / days);
    const dailyTaxable = Math.max(0, daily - 150_000);
    let incomeTax = floorWon(dailyTaxable * 0.06) * days;
    if (incomeTax < 1_000) incomeTax = 0;
    const localTax = floorWon(incomeTax * 0.1);
    return {
      method: input.method,
      methodLabel: "일용근로소득",
      gross,
      expense: Math.min(gross, 150_000 * days),
      taxable: dailyTaxable * days,
      incomeTax,
      localTax,
      withholding: incomeTax + localTax,
      net: gross - incomeTax - localTax,
      notes: [
        `근무 ${days}일 · 환산 일당 ${daily.toLocaleString("ko-KR")}원 기준입니다.`,
        "일용근로는 1일 15만 원까지 근로소득공제 후 6%(+지방 0.6%)를 원천징수합니다.",
        "징수세액이 1천 원 미만이면 소액부징수로 원천징수하지 않습니다.",
      ],
    };
  }

  if (input.method === "wage") {
    return {
      method: input.method,
      methodLabel: "근로소득 (간이세액)",
      gross,
      expense: 0,
      taxable: gross,
      incomeTax: 0,
      localTax: 0,
      withholding: 0,
      net: gross,
      notes: [
        "정규·계약 인건비는 간이세액표와 사대보험을 급여 프로그램에서 계산합니다.",
        "SPM에는 계약·이체·원천징수영수증만 묶어 두고, 세액은 급여 원장 숫자를 그대로 적습니다.",
      ],
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
