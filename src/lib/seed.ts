import type { Lodging, Payout, ShootDay } from "./types";
import { typeById } from "./payout-types";

const SIGNOK_URL =
  "https://doc.signok.com/signRequest/authentication.sg?HvPR5JNATABs4mKPLUGJNai4zsXgVkHrExbSEJpInNM4B5quYRNbz1VsmGNpKsKbKQH3uSqCmQQ61CoPXPJlWPuqA8bMk4/4uOFe6khrkdfUtcCqs6lT1rM2f00tWMjJFKIapIFCnbGNDXkDwaprjauiZfGJZ4n2nzX4flV7RwXyOFOKKZR/km7OAGiFoJAdNVQMiGUknHe6J1LAa+1v4+4k80sXAqMmoYBqzk1Q2NI=&encrpt_";

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdYww1CkXLwuoeSd1ehYL2xIu-urRy4y-JNUmNLRkr11oOzOg/viewform";

const lodging: Lodging = {
  name: "마이애미 정선호텔",
  address: "강원특별자치도 정선군 고한읍 고한로 45",
  phone: "033-804-7011",
  checkIn: "15:00",
  checkOut: "11:00",
  note: "촬영계획표에 적힌 숙소입니다. 호수는 현장에서 받은 배정을 여기에 옮깁니다. 예시 호수를 만들지 않았습니다.",
  people: [
    { id: "p-jh", name: "조현경", role: "연출감독", phone: "010-3466-9402" },
    { id: "p-jhl", name: "지혜림", role: "조연출", phone: "010-9239-0316" },
    { id: "p-shw", name: "서한울", role: "연출부", phone: "010-7211-3305" },
    { id: "p-hwy", name: "한원영", role: "연출 PD", phone: "010-8695-0840" },
    { id: "p-cbn", name: "최빈나", role: "제작부", phone: "010-3444-8691" },
    { id: "p-jnh", name: "조남현", role: "촬영감독", phone: "010-2075-1407" },
    { id: "p-lsh", name: "이상현", role: "촬영팀", phone: "010-8897-2821" },
    { id: "p-cym", name: "최윤민", role: "사운드감독", phone: "010-8107-0004" },
    { id: "p-ksh", name: "김수환", role: "조명감독", phone: "010-4184-4419" },
    { id: "p-ysh", name: "유수현", role: "배우 (영서)", note: "동서울 → 태백터미널 08:30 출발 / 11:30 도착" },
    { id: "p-bhm", name: "백하민", role: "배우 (영동)", note: "청량리 → 태백역 07:34 출발 / 11:16 도착" },
    {
      id: "p-ljm",
      name: "이재명",
      role: "로케이션 자문 · 투어메이커",
      phone: "010-9443-7881",
      note: "자문 계약기간은 8/24~25 답사입니다. 촬영기간 숙박 여부는 배정에서만 표시합니다.",
    },
  ],
  rooms: [
    { id: "r1", label: "호수 미정 A", type: "twin", occupantIds: [] },
    { id: "r2", label: "호수 미정 B", type: "twin", occupantIds: [] },
    { id: "r3", label: "호수 미정 C", type: "twin", occupantIds: [] },
    { id: "r4", label: "호수 미정 D", type: "twin", occupantIds: [] },
    { id: "r5", label: "호수 미정 E", type: "twin", occupantIds: [] },
    { id: "r6", label: "호수 미정 F", type: "single", occupantIds: [] },
  ],
};

const schedule: ShootDay[] = [
  {
    round: 1,
    date: "2026-09-07",
    callTime: "12:00",
    shootTime: "14:30",
    lodgingName: "마이애미 정선 고한로 45",
    locations: [
      "태백 구문소 (동점동 498-123)",
      "바람의 언덕 배추밭 (창죽동 9-440)",
    ],
    meals: [
      { when: "중식", place: "연화식당 (제육/된장)" },
      { when: "석식", place: "화평식당 (비빔밥)" },
    ],
    beats: [
      { time: "12:00~13:00", place: "점심", content: "1시간" },
      {
        time: "13:00~14:00",
        scene: "1-13",
        place: "태백 구문소 굴 아래",
        content: "영동과 영서가 스쿠터를 타고 구문소 굴 아래를 달린다.",
      },
      {
        time: "14:30~15:30",
        scene: "1-14",
        place: "태백 구문소 폭포",
        content: "영동 영서가 폭포를 바라본다.",
      },
      {
        time: "16:30~18:00",
        scene: "3-9",
        place: "태백 바람의 언덕 배추밭",
        content: "바람의 언덕에서 바람을 맞으며 배추밭을 달린다.",
      },
    ],
  },
  {
    round: 2,
    date: "2026-09-08",
    callTime: "08:30",
    shootTime: "09:00",
    lodgingName: "마이애미 정선 고한로 45",
    locations: [
      "보쉬카서비스 대한밧데리 (정선군 남면 문은단로 137)",
      "논밭 (남면 무릉2로 35-15)",
      "수려안 아파트 (남면 별어곡2길 37)",
    ],
    meals: [
      { when: "조식", place: "와와김밥" },
      { when: "중식", place: "부길한식당 (곤드레밥)" },
      { when: "석식", place: "롯데리아" },
    ],
    beats: [
      { time: "09:00~10:30", scene: "1-1", place: "정선 카센터", content: "영동이 헬멧을 찾다가 카메라를 발견한다." },
      { time: "10:30~11:30", scene: "3-1", place: "정선 카센터", content: "영동이 사무실을 뒤져 오래된 디지털 카메라를 찾는다." },
      { time: "12:00~13:00", scene: "1-3", place: "아파트 인근 논밭", content: "영서가 논밭을 촬영하려 하자 지나가던 영동이 멈춘다." },
      { time: "13:00~14:00", place: "점심", content: "1시간" },
      { time: "14:00~15:00", scene: "1-2", place: "아파트 단지", content: "카메라를 든 영서가 산책로를 걷는다." },
      { time: "15:00~16:00", scene: "2-1", place: "아파트 단지 벤치", content: "릴스 조회수 300 달성 후 영서와 영동 계정을 만든다." },
      { time: "16:30~17:00", scene: "1-4", place: "아파트 현관", content: "영서가 이사 떡을 건넨다." },
      { time: "17:10~17:40", scene: "3-2", place: "아파트 현관", content: "영서의 집을 찾아가는 영동." },
      { time: "17:40~18:20", scene: "1-5", place: "아파트 복도", content: "등교하려던 영동이 집에서 화를 내며 나오는 영서와 마주친다." },
      { time: "18:20~19:30", scene: "2-7", place: "아파트 단지", content: "집으로 향하던 중 영서의 카메라가 망가진다." },
    ],
  },
  {
    round: 3,
    date: "2026-09-07",
    callTime: "07:30",
    shootTime: "08:30",
    lodgingName: "마이애미 정선 고한로 45",
    locations: [
      "철암 탄광촌 (태백시 동태백로 406)",
      "삼방동 전망대 (삼방1길 2-21, 2-27)",
    ],
    meals: [
      { when: "조식", place: "에그마니 (김밥)" },
      { when: "중식", place: "불로닭 (물닭갈비)" },
    ],
    beats: [
      { time: "08:30~10:00", scene: "1-8", place: "철암탄광촌", content: "탄광촌에 도착한 영서와 영동." },
      { time: "10:00~11:00", scene: "1-9", place: "탄광촌 동굴 앞", content: "영서와 영동이 동굴을 지나간다." },
      { time: "11:00~12:00", scene: "1-10", place: "탄광촌 전시관", content: "영서와 영동이 전시관을 둘러본다." },
      { time: "12:00~13:00", place: "점심", content: "1시간" },
      { time: "13:00~14:00", scene: "1-11", place: "탄광촌 옥상", content: "영동이 자신의 할아버지 이야기를 해준다." },
      { time: "14:00~16:00", scene: "1-12", place: "삼방동 전망대", content: "릴스를 못 찍는 영동을 위해 도움을 주는 영서." },
    ],
  },
  {
    round: 4,
    date: "2026-09-14",
    callTime: "12:00",
    shootTime: "13:00",
    lodgingName: "마이애미 정선 고한로 45",
    locations: [
      "고한고등학교 (고한읍 고한9길 160)",
      "아우라지식당 (정선읍 5일장길 55)",
    ],
    meals: [{ when: "석식", place: "장칼국수 (태백)" }],
    beats: [
      { time: "13:00~14:00", scene: "1-6", place: "고한고등학교 정문", content: "하교길, 영서와 영동이 계단을 내려간다." },
      { time: "14:30~15:30", scene: "1-7", place: "도로1 아파트단지", content: "스쿠터를 타고 어디론가 향하는 둘." },
      { time: "16:00~17:00", scene: "3-3", place: "단풍도로", content: "스쿠터를 타고 운탄고도로 향한다." },
      { time: "17:00~18:00", place: "석식", content: "1시간" },
      { time: "18:00~20:00", scene: "2-4", place: "태백 장칼국수집", content: "영서와 영동이 된장 장칼국수를 먹는다." },
    ],
  },
  {
    round: 5,
    date: "2026-09-15",
    callTime: "07:00",
    shootTime: "08:00",
    lodgingName: "마이애미 정선 고한로 45",
    locations: [
      "통리장 (태백시 통동 69-35)",
      "극단 (사북읍 사북2길 16)",
    ],
    meals: [{ when: "중식", place: "점심 1시간" }],
    beats: [
      { time: "08:00~10:00", scene: "2-2", place: "통리 오일장", content: "영서는 시장 풍경을, 영동은 시장 음식을 찍는다." },
      { time: "10:00~11:30", scene: "2-3", place: "오일장 오징어수조 앞", content: "강릉에서 온 오징어를 보며 영서가 고향을 떠올린다." },
      { time: "12:00~13:00", place: "점심", content: "1시간" },
      { time: "13:00~14:00", scene: "2-5", place: "극단 앞 골목", content: "탄광 연극단 인터뷰를 하러 간다." },
      { time: "14:00~15:30", scene: "2-6", place: "극단 연극 연습실", content: "영서와 영동이 연극 연습 장면을 본다." },
      { time: "15:30~17:30", scene: "2-6", place: "극단 연극 연습실", content: "극단 사람들의 인터뷰 영상을 촬영한다." },
    ],
  },
  {
    round: 6,
    date: "2026-09-16",
    callTime: "06:30",
    shootTime: "08:00",
    lodgingName: "마이애미 정선 고한로 45",
    locations: ["운탄고도 도롱이 연못 (사북읍 하이원길 202)"],
    meals: [{ when: "중식", place: "점심 1시간" }],
    beats: [
      { time: "08:00~10:00", scene: "3-6", place: "도롱이 연못 옆 숲", content: "영동이 영서에게 오래된 디지털 카메라를 선물한다." },
      { time: "10:00~12:00", scene: "3-7", place: "도롱이 연못", content: "영서와 영동이 연못을 배경으로 촬영한다." },
      { time: "12:00~13:00", place: "점심", content: "1시간" },
      { time: "13:30~15:00", scene: "3-5", place: "운탄고도 숲길", content: "카메라를 든 영서가 산책로를 걷는다." },
      { time: "15:30~17:00", scene: "3-4", place: "운탄고도 입구", content: "영서와 영동이 스쿠터를 주차하고 운탄고도를 걷는다." },
    ],
  },
];

const lecture = typeById("lecture");
const freelancer = typeById("freelancer");

export const SEED_PAYOUTS: Payout[] = [
  {
    id: "out-tm-260903-kimryeon",
    typeId: "lecture",
    side: "out",
    title: "태백해설사 심화교육 강사료 · 김련",
    partnerName: "김련",
    partnerRole: "강사 · 동굴박사",
    eventName: "2026 강원고생대국가지질공원 태백해설사 심화교육",
    clientName: "태백고생대자연사박물관",
    documentNo: "TM-260903",
    needsContract: false,
    gross: 2_000_000,
    taxMethod: "business-3-3",
    dueDate: "2026-09-10",
    collectInsurance: false,
    collectPassport: false,
    periodStart: "2026-09-03",
    periodEnd: "2026-09-04",
    workLines: ["동굴 지질강의", "용연동굴 · 고씨동굴 · 백룡동굴 현장답사"],
    status: "collecting",
    memo: "투어메이커와 별도 계약을 맺은 강사가 아닙니다. 이재명이 수배했고, 발주처(태백고생대자연사박물관) 견적 강사비 2,000,000원을 그대로 지출합니다. 이체용 성명·주민번호·신분증·계좌를 받습니다.",
    docs: [
      {
        id: "d-guidebook",
        title: "태백해설사 심화교육 스마트 가이드북",
        href: "https://indadady.github.io/260903_Taebaek/",
        kind: "web",
      },
    ],
    evidence: lecture.evidence,
    survey: [],
  },
  {
    id: "in-yeongseo-yeongdong",
    typeId: "freelancer",
    side: "in",
    title: "웹드라마 <영서와 영동> 로케이션 자문",
    partnerName: "명륜아지트",
    partnerRole: "제작사 (갑)",
    eventName: "웹드라마 <영서와 영동>",
    gross: 300_000,
    taxMethod: "other-income-60",
    dueDate: "2026-10-10",
    status: "contract",
    memo: "법인 손금이 아닙니다. 명륜아지트가 이재명 개인에게 준 자문료입니다. 링크만으로 계약·자료를 받은 형식을 남겨 둔 참고 사례입니다.",
    docs: [
      {
        id: "d-contract",
        title: "자문 계약서_이재명.pdf",
        href: "/docs/자문계약서_이재명.pdf",
        kind: "pdf",
      },
      {
        id: "d-sign",
        title: "싸인오케이 전자서명",
        href: SIGNOK_URL,
        kind: "sign",
        note: "제작사가 보낸 서명 요청 링크입니다.",
      },
      {
        id: "d-plan",
        title: "영서와영동_일일촬영계획표_260904.pdf",
        href: "/docs/영서와영동_일일촬영계획표_260904.pdf",
        kind: "pdf",
      },
      {
        id: "d-form",
        title: "구글 설문",
        href: GOOGLE_FORM_URL,
        kind: "form",
        note: "로그인 필요한 외부 설문입니다. 내부 설문은 이 건의 설문 탭을 씁니다.",
      },
      {
        id: "d-drive",
        title: "드라이브 폴더 · 기타사업소득_이재명 / 웹드라마",
        href: "https://drive.google.com/drive/folders/1s0-fD9YyDL3AQwoaYaKNmc7_rioMJh8N",
        kind: "drive",
      },
    ],
    evidence: [
      ...freelancer.evidence,
      { id: "in-plan", label: "촬영 계획표 (사업 실체 증빙)" },
      { id: "in-sign", label: "전자서명 완료본" },
    ],
    survey: [
      { id: "name", label: "을 (자문) 성명", type: "text", required: true },
      { id: "phone", label: "연락처", type: "tel", required: true },
      {
        id: "done",
        label: "8월 24~25일 사전 답사·로케이션 헌팅·지역 문화 소개를 수행했습니까?",
        type: "yesno",
        required: true,
      },
      {
        id: "fee",
        label: "자문료 300,000원 (총액, 원천징수 후 10월 10일 이내 입금)을 확인합니까?",
        type: "yesno",
        required: true,
      },
      { id: "bank", label: "입금 계좌 (은행·번호·예금주)", type: "text", required: true },
      { id: "sign", label: "싸인오케이 서명을 마쳤습니까?", type: "yesno", required: true },
      { id: "note", label: "특이사항", type: "textarea" },
    ],
    externalFormUrl: GOOGLE_FORM_URL,
    contract: {
      title: "자문 계약서",
      signedAt: "2026-08-24",
      periodStart: "2026-08-24",
      periodEnd: "2026-08-25",
      workSummary: [
        "웹드라마 <영서와 영동> 촬영 사전 답사 코디네이터",
        "로케이션 헌팅",
        "지역 문화 소개",
        "대면 및 답사 동행 · 2회",
      ],
      clauses: [
        {
          title: "제1조 자문 내용",
          body: "을은 갑이 추진하는 웹드라마 <영서와 영동> 촬영과 관련하여 촬영 사전 답사 코디네이터, 로케이션 헌팅, 지역 문화 소개를 대면 및 답사 동행으로 2회 수행한다.",
        },
        {
          title: "제2조 계약기간",
          body: "2026년 8월 24일부터 2026년 8월 25일까지.",
        },
        {
          title: "제3조 자문료",
          body: "금 300,000원을 총액 기준으로 지급한다. 관련 법령에 따른 원천징수 금액을 공제한 후 지급할 수 있다. 10월 10일 이내에 계좌로 입금한다.",
        },
        {
          title: "제4조 비밀유지",
          body: "을은 자문 과정에서 알게 된 갑의 비공개 자료 및 정보를 계약 목적 외로 사용하거나 제3자에게 공개하지 않는다.",
        },
        {
          title: "제5조 결과물 및 이용",
          body: "자문 과정에서 작성된 의견서·검토자료 등 결과물은 갑이 본 사업의 운영, 결과보고 및 관련 행정업무에 활용할 수 있다. 을이 기존에 보유하던 자료 및 전문지식에 대한 권리는 을에게 귀속된다.",
        },
        {
          title: "제6조 기타",
          body: "본 계약은 근로계약이 아닌 독립적인 자문 업무 계약이다. 변경 사항은 상호 협의한다. 중도 종료 시 실제 수행한 범위를 기준으로 정산한다.",
        },
      ],
      partyA: {
        label: "갑",
        name: "명륜아지트",
        title: "대표 문준현",
        phone: "010-6759-1207",
      },
      partyB: {
        label: "을",
        name: "이재명",
        title: "투어메이커 대표",
        phone: "010-9443-7881",
        birth: "1978.09.11",
      },
      signUrl: SIGNOK_URL,
      pdfHref: "/docs/자문계약서_이재명.pdf",
    },
    lodging,
    schedule,
  },
];
