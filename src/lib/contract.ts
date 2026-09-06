import { COMPANY } from "./company";
import { formatWon } from "./format";
import type { Contract, Payout } from "./types";

export function defaultContract(payout: Payout): Contract {
  if (payout.contract) return payout.contract;
  return {
    title: "용역 계약서",
    periodStart: payout.periodStart,
    periodEnd: payout.periodEnd,
    workSummary: payout.workLines ?? [
      `${payout.eventName ?? payout.title}에 따른 ${payout.partnerRole} 용역`,
    ],
    clauses: [
      {
        title: "제1조 (용역 내용)",
        body: `을은 갑이 수행하는 「${payout.eventName ?? payout.title}」와 관련하여 ${payout.partnerRole} 용역을 수행한다.`,
      },
      {
        title: "제2조 (기간)",
        body:
          payout.periodStart && payout.periodEnd
            ? `용역 기간은 ${payout.periodStart}부터 ${payout.periodEnd}까지로 한다.`
            : "용역 기간은 갑과 을이 협의한 수행일로 한다.",
      },
      {
        title: "제3조 (용역비)",
        body: `갑은 을에게 용역비 금 ${formatWon(payout.gross)}을 총액으로 지급한다. 사업소득 원천징수 3.3%(소득세 3%, 지방소득세 0.3%)를 제외한 금액을 을의 본인 명의 계좌로 입금한다.`,
      },
      {
        title: "제4조 (자료 제출)",
        body: "을은 원천징수 및 이체를 위해 성명, 주민등록번호, 신분증 사본, 본인 명의 계좌를 갑에게 제출한다. 갑은 해당 정보를 지급·세무 신고 목적 외로 사용하지 않는다.",
      },
      {
        title: "제5조 (비밀유지)",
        body: "을은 용역 과정에서 알게 된 갑의 비공개 자료를 목적 외로 사용하거나 제3자에게 제공하지 않는다.",
      },
      {
        title: "제6조 (독립 용역)",
        body: "본 계약은 근로계약이 아닌 독립적인 용역 계약이다. 정하지 않은 사항은 상호 협의한다.",
      },
    ],
    partyA: {
      label: "갑",
      name: COMPANY.name,
      title: `대표 ${COMPANY.representative}`,
      phone: COMPANY.mobile,
    },
    partyB: {
      label: "을",
      name: payout.partnerName,
      title: payout.partnerRole,
    },
  };
}
