import type { EvidenceItem, PayoutTypeId, TaxMethod } from "./types";

export type PayoutTypeDef = {
  id: PayoutTypeId;
  name: string;
  short: string;
  when: string;
  taxDefault: TaxMethod;
  taxHint: string;
  payee: string;
  flow: string[];
  evidence: EvidenceItem[];
};

const payeeEvidence: EvidenceItem[] = [
  { id: "payee-name", label: "성명" },
  { id: "payee-rrn", label: "주민등록번호" },
  { id: "payee-id", label: "신분증 사본" },
  { id: "payee-bank", label: "본인 명의 계좌" },
];

export const PAYOUT_TYPES: PayoutTypeDef[] = [
  {
    id: "lecture",
    name: "강사료",
    short: "사업소득 3.3%",
    when: "해설·특강·연수 강의처럼 지식 제공의 대가로 주는 돈입니다.",
    taxDefault: "business-3-3",
    taxHint: "사업소득으로 보고 3.3%를 원천징수한 뒤 이체합니다. 직원 급여는 SPM에 넣지 않습니다.",
    payee: "강사",
    flow: [
      "링크로 성명·주민등록번호·신분증·본인 계좌 수집",
      "발주처가 정한 금액에서 원천 3.3% 제외 후 이체",
      "이체증·원천 신고 자료 보관",
    ],
    evidence: [
      ...payeeEvidence,
      { id: "lec-transfer", label: "이체 확인증" },
      { id: "lec-withholding", label: "원천징수 신고 자료" },
    ],
  },
  {
    id: "event-staff",
    name: "행사요원",
    short: "사업소득 3.3%",
    when: "인솔 보조, 짐 내리기, 당일 스태프처럼 행사에만 붙는 사람입니다.",
    taxDefault: "business-3-3",
    taxHint: "근로소득·일용이 아니라 사업소득 3.3%로 정리합니다.",
    payee: "행사요원",
    flow: [
      "링크로 성명·주민등록번호·신분증·본인 계좌 수집",
      "원천 3.3% 제외 후 이체",
    ],
    evidence: [
      ...payeeEvidence,
      { id: "staff-transfer", label: "이체 확인증" },
    ],
  },
  {
    id: "experience",
    name: "체험비",
    short: "3.3% 또는 세금계산서",
    when: "공방, 농장, 레일바이크처럼 현지 체험장에 주는 돈입니다.",
    taxDefault: "business-3-3",
    taxHint: "개인이면 사업소득 3.3%. 사업자등록이 있으면 세금계산서로 바꿉니다.",
    payee: "체험장·운영자",
    flow: [
      "견적·인원 확인",
      "사업자 없으면 인적정보 링크 수집",
      "세금계산서 또는 원천 3.3% 후 이체",
    ],
    evidence: [
      ...payeeEvidence,
      { id: "exp-quote", label: "견적서" },
      { id: "exp-biz", label: "사업자등록증 (있는 경우)" },
      { id: "exp-invoice", label: "세금계산서 또는 원천 자료" },
      { id: "exp-transfer", label: "이체 확인증" },
    ],
  },
  {
    id: "freelancer",
    name: "개인사업자 · 프리랜서",
    short: "용역 3.3%",
    when: "가이드, 기사, 자문, 디자인처럼 개인에게 용역비를 줄 때입니다.",
    taxDefault: "business-3-3",
    taxHint: "기본은 사업소득 3.3%. 세금계산서를 끊는 사업자면 원천 없이 이체합니다.",
    payee: "개인사업자 또는 프리랜서",
    flow: [
      "링크로 성명·주민등록번호·신분증·본인 계좌 수집",
      "원천 3.3% 제외 후 이체",
    ],
    evidence: [
      ...payeeEvidence,
      { id: "fr-transfer", label: "이체 확인증" },
      { id: "fr-withholding", label: "원천징수 신고 자료" },
    ],
  },
  {
    id: "revenue-share",
    name: "수익쉐어",
    short: "정산 후 3.3%",
    when: "공동 기획, 현지 파트너, 강사와 행사 수익을 나누는 약정입니다.",
    taxDefault: "business-3-3",
    taxHint: "정산 후 개인 배분은 사업소득 3.3%. 사업자면 세금계산서입니다.",
    payee: "수익 배분 파트너",
    flow: [
      "배분 비율 약정",
      "매출·원가 확정 후 정산서",
      "인적정보 수집 또는 세금계산서",
      "원천 3.3% 또는 계산서 후 이체",
    ],
    evidence: [
      ...payeeEvidence,
      { id: "rs-agree", label: "수익배분 약정" },
      { id: "rs-settle", label: "정산서" },
      { id: "rs-transfer", label: "이체 확인증" },
    ],
  },
];

export function typeById(id: PayoutTypeId) {
  const found = PAYOUT_TYPES.find((t) => t.id === id);
  if (!found) throw new Error(`unknown type ${id}`);
  return found;
}

export function payeeMissing(
  p?: {
    name?: string;
    phone?: string;
    rrn?: string;
    signatureDataUrl?: string;
    bank?: string;
    account?: string;
    holder?: string;
    idImageDataUrl?: string;
    idImageUrl?: string;
    passportImageDataUrl?: string;
    passportImageUrl?: string;
    privacyAgreed?: boolean;
  },
  opts?: { passport?: boolean }
) {
  const miss: string[] = [];
  if (!p?.name?.trim()) miss.push("성명");
  if (!p?.phone?.trim()) miss.push("연락처");
  if (!p?.rrn?.trim()) miss.push("주민등록번호");
  if (!p?.idImageDataUrl && !p?.idImageUrl) miss.push("신분증 사진");
  if (opts?.passport && !p?.passportImageDataUrl && !p?.passportImageUrl) miss.push("여권사본");
  if (!p?.bank?.trim()) miss.push("은행");
  if (!p?.account?.trim()) miss.push("계좌번호");
  if (!p?.holder?.trim()) miss.push("예금주");
  if (!p?.signatureDataUrl) miss.push("서명");
  if (!p?.privacyAgreed) miss.push("개인정보 동의");
  return miss;
}

export function payeeReady(p?: Parameters<typeof payeeMissing>[0]) {
  return payeeMissing(p).length === 0;
}
