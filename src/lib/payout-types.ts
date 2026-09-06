import type { EvidenceItem, PayoutTypeId, SurveyQuestion, TaxMethod } from "./types";

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
  survey: SurveyQuestion[];
};

const commonPayeeQuestions: SurveyQuestion[] = [
  { id: "name", label: "성명 (예금주와 동일)", type: "text", required: true },
  { id: "phone", label: "휴대전화", type: "tel", required: true },
  { id: "role", label: "역할·용역 내용", type: "text", required: true },
  {
    id: "biz",
    label: "사업자등록이 있습니까?",
    type: "select",
    options: ["없음 (개인·프리랜서)", "있음 (개인사업자·법인)"],
    required: true,
    help: "있으면 세금계산서, 없으면 원천징수입니다.",
  },
  { id: "bizNo", label: "사업자등록번호 (있는 경우)", type: "text" },
  {
    id: "rrn",
    label: "주민등록번호 (원천징수 신고용)",
    type: "text",
    help: "이 기기에만 저장됩니다. 서버로 보내지 않습니다.",
  },
  { id: "bank", label: "입금 은행", type: "text", required: true },
  { id: "account", label: "계좌번호", type: "text", required: true },
  { id: "holder", label: "예금주", type: "text", required: true },
  {
    id: "privacy",
    label: "원천징수·이체를 위한 개인정보 수집에 동의합니다.",
    type: "check",
    required: true,
  },
];

export const PAYOUT_TYPES: PayoutTypeDef[] = [
  {
    id: "labor",
    name: "인건비",
    short: "근로소득",
    when: "투어메이커 직원·계약직 급여처럼, 사용종속관계가 있는 사람에게 주는 돈입니다.",
    taxDefault: "wage",
    taxHint: "간이세액 + 사대보험. 원천징수세액은 급여 프로그램 숫자를 그대로 붙입니다.",
    payee: "근로자",
    flow: ["근로계약 서명", "급여일 원천·사대보험 공제", "이체증·급여명세서 보관", "원천세 신고"],
    evidence: [
      { id: "labor-contract", label: "근로계약서" },
      { id: "labor-id", label: "신분증 사본" },
      { id: "labor-bank", label: "통장 사본" },
      { id: "labor-payslip", label: "급여명세서" },
      { id: "labor-transfer", label: "이체 확인증" },
      { id: "labor-withholding", label: "원천징수영수증" },
    ],
    survey: [
      ...commonPayeeQuestions,
      { id: "start", label: "입사일 또는 계약 시작일", type: "text", required: true },
      { id: "pay", label: "월 급여 (세전)", type: "text", required: true },
    ],
  },
  {
    id: "event-staff",
    name: "행사요원",
    short: "일용·현장",
    when: "인솔 보조, 짐 내리기, 당일 스태프처럼 행사에만 붙는 사람입니다.",
    taxDefault: "daily-wage",
    taxHint: "일용근로. 1일 15만 원 공제 후 6.6%. 소액이면 원천징수하지 않을 수 있습니다.",
    payee: "일용 근로자",
    flow: ["근무 확인 설문", "일용 계약·명단", "근무일·일당 확정", "원천 후 이체"],
    evidence: [
      { id: "staff-list", label: "요원 명단" },
      { id: "staff-work", label: "근무확인서 / 일용계약" },
      { id: "staff-id", label: "신분증 사본" },
      { id: "staff-bank", label: "계좌 정보" },
      { id: "staff-log", label: "근무일지" },
      { id: "staff-transfer", label: "이체 확인증" },
      { id: "staff-withholding", label: "원천징수 내역" },
    ],
    survey: [
      ...commonPayeeQuestions,
      { id: "event", label: "행사명", type: "text", required: true },
      { id: "workDates", label: "근무일", type: "text", required: true },
      { id: "daily", label: "일당", type: "text", required: true },
      { id: "duty", label: "담당 업무", type: "textarea" },
    ],
  },
  {
    id: "lecture",
    name: "강사료",
    short: "기타소득",
    when: "해설·특강·연수 강의처럼 지식 제공의 대가로 주는 돈입니다.",
    taxDefault: "other-income-60",
    taxHint: "기타소득 필요경비 60%. 지급액의 8.8%를 원천징수합니다.",
    payee: "강사",
    flow: ["강사 정보 설문", "강사 계약·서명", "강의 확인", "원천 8.8% 후 이체"],
    evidence: [
      { id: "lec-contract", label: "강사 위촉·용역 계약" },
      { id: "lec-profile", label: "이력·자격 자료" },
      { id: "lec-confirm", label: "강의 확인서" },
      { id: "lec-bank", label: "계좌 정보" },
      { id: "lec-transfer", label: "이체 확인증" },
      { id: "lec-withholding", label: "원천징수영수증" },
    ],
    survey: [
      ...commonPayeeQuestions,
      { id: "topic", label: "강의 주제", type: "text", required: true },
      { id: "when", label: "강의 일시·장소", type: "text", required: true },
      { id: "fee", label: "강사료 (세전)", type: "text", required: true },
    ],
  },
  {
    id: "experience",
    name: "체험비",
    short: "현지 체험",
    when: "공방, 농장, 레일바이크처럼 현지 체험장에 주는 돈입니다.",
    taxDefault: "tax-invoice",
    taxHint: "사업자면 세금계산서. 미등록 개인이면 사업소득 3.3% 원천징수입니다.",
    payee: "체험장·운영자",
    flow: ["견적·인원 확인", "계약 또는 발주", "세금계산서 또는 원천", "이체·현장 증빙"],
    evidence: [
      { id: "exp-quote", label: "견적서" },
      { id: "exp-contract", label: "계약·발주 확인" },
      { id: "exp-biz", label: "사업자등록증" },
      { id: "exp-invoice", label: "세금계산서 또는 원천 자료" },
      { id: "exp-photo", label: "현장 증빙 (인원·장소)" },
      { id: "exp-transfer", label: "이체 확인증" },
    ],
    survey: [
      ...commonPayeeQuestions,
      { id: "place", label: "체험 시설명", type: "text", required: true },
      { id: "program", label: "프로그램명", type: "text", required: true },
      { id: "pax", label: "인원·단가", type: "text", required: true },
      { id: "date", label: "이용일", type: "text", required: true },
    ],
  },
  {
    id: "freelancer",
    name: "개인사업자 · 프리랜서",
    short: "용역",
    when: "가이드, 기사, 자문, 디자인처럼 사업자 또는 개인에게 용역비를 줄 때입니다.",
    taxDefault: "business-3-3",
    taxHint: "사업자등록이 있으면 세금계산서. 없으면 사업소득 3.3%. 자문·강연 성격이면 기타소득 8.8%가 맞을 수 있습니다.",
    payee: "개인사업자 또는 프리랜서",
    flow: ["사업자 여부 설문", "용역 계약·서명", "세금계산서 또는 원천", "이체·결과물 보관"],
    evidence: [
      { id: "fr-contract", label: "용역·자문 계약서" },
      { id: "fr-biz", label: "사업자등록증 또는 신분증" },
      { id: "fr-invoice", label: "세금계산서 또는 원천 자료" },
      { id: "fr-work", label: "수행 확인 (일정·결과)" },
      { id: "fr-bank", label: "계좌 정보" },
      { id: "fr-transfer", label: "이체 확인증" },
    ],
    survey: [
      ...commonPayeeQuestions,
      { id: "work", label: "용역 내용", type: "textarea", required: true },
      { id: "period", label: "수행 기간", type: "text", required: true },
      { id: "fee", label: "용역비 (세전)", type: "text", required: true },
    ],
  },
  {
    id: "revenue-share",
    name: "수익쉐어",
    short: "정산 배분",
    when: "공동 기획, 현지 파트너, 강사와 행사 수익을 나누는 약정입니다.",
    taxDefault: "business-3-3",
    taxHint: "배분 약정 + 매출 증빙으로 정산합니다. 사업자면 세금계산서, 개인이면 3.3% 또는 기타소득입니다.",
    payee: "수익 배분 파트너",
    flow: ["배분 비율 약정", "매출·원가 확정", "정산서 서명", "세금계산서 또는 원천 후 이체"],
    evidence: [
      { id: "rs-agree", label: "수익배분 약정" },
      { id: "rs-sales", label: "매출 증빙" },
      { id: "rs-settle", label: "정산서" },
      { id: "rs-invoice", label: "세금계산서 또는 원천 자료" },
      { id: "rs-transfer", label: "이체 확인증" },
    ],
    survey: [
      ...commonPayeeQuestions,
      { id: "event", label: "행사·상품명", type: "text", required: true },
      { id: "rate", label: "배분 비율", type: "text", required: true },
      { id: "sales", label: "정산 대상 매출", type: "text", required: true },
      { id: "cost", label: "차감 원가 (있으면)", type: "text" },
    ],
  },
];

export function typeById(id: PayoutTypeId) {
  const found = PAYOUT_TYPES.find((t) => t.id === id);
  if (!found) throw new Error(`unknown type ${id}`);
  return found;
}
