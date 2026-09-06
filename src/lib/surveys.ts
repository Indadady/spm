export type SatisfactionSurvey = {
  id: string;
  title: string;
  eventName: string;
  periodLabel: string;
  intro: string;
  guidebookUrl: string;
};

export const TAEBAEK_SURVEY: SatisfactionSurvey = {
  id: "tm-260903",
  title: "스마트 가이드북 1차 사용자 평가",
  eventName: "2026 강원고생대국가지질공원 태백해설사 심화교육",
  periodLabel: "2026.09.03 ~ 09.04",
  intro:
    "기존 안내(인쇄물·PDF·카카오톡)와 비교하여 응답해 주세요. 1=전혀 그렇지 않다, 5=매우 그렇다.",
  guidebookUrl: "https://indadady.github.io/260903_Taebaek/",
};

export const SCALE_A = [
  { id: "A1", label: "A1. 원하는 정보(일정·장소·연락처)를 쉽게 찾을 수 있었다" },
  { id: "A2", label: "A2. 오늘의 일정과 이동 순서를 이해하는 데 도움이 되었다" },
  { id: "A3", label: "A3. 날씨·옷차림·지도 등 현지 정보가 실제로 유용했다" },
  { id: "A4", label: "A4. 비상 연락망 등 긴급 정보에 빠르게 접근할 수 있었다" },
  { id: "A5", label: "A5. 전반적으로 사용에 만족한다" },
  { id: "A6", label: "A6. 다음 행사에서도 다시 사용하고 싶다" },
  { id: "A7", label: "A7. 기존 인쇄물·PDF·메신저보다 정보가 찾기 쉬웠다" },
  { id: "A8", label: "A8. 다른 참가자에게 이 안내 방식을 추천하겠다" },
] as const;

export const SCALE_B = [
  { id: "B1", label: "B1. 행사 자료를 한곳에서 관리하기 편리했다" },
  { id: "B2", label: "B2. 웹 안내와 인쇄 일정표를 함께 만들·배포하기 쉬웠다" },
  { id: "B3", label: "B3. 일정·장소·연락처의 정확성·신뢰도가 높다고 느꼈다" },
  { id: "B4", label: "B4. 기존보다 안내·보고 업무 부담이 줄었다" },
  { id: "B5", label: "B5. 수기·분산 자료 대비 오류가 줄었다고 느꼈다" },
  { id: "B6", label: "B6. 다음 행사에도 재사용할 의향이 있다" },
  { id: "B7", label: "B7. (공공기관) ESG·페이퍼리스 수치가 설명에 도움이 되었다" },
] as const;

export const INTERVIEW_C = [
  { id: "C1", label: "C1. 가장 자주 확인한 정보는?" },
  { id: "C2", label: "C2. 인쇄물·PDF·카카오톡과 비교한 장단점은?" },
  { id: "C3", label: "C3. 없으면 불편한, 추가되면 좋을 기능은?" },
  { id: "C4", label: "C4. 현장에서 헷갈리거나 불편했던 화면·동선·문구는?" },
  { id: "C5", label: "C5. 자료 수정·공유·인쇄에서 시간이 줄거나 늘어난 부분은?" },
] as const;

export const ROLE_OPTIONS = ["해설사(참가자)", "인솔자", "공공기관 직원", "운영 인력"] as const;
export const DEVICE_OPTIONS = ["스마트폰", "태블릿", "PC", "인쇄물"] as const;

export function surveyById(id: string) {
  if (id === TAEBAEK_SURVEY.id) return TAEBAEK_SURVEY;
  return undefined;
}
