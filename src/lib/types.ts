export type PayoutTypeId =
  | "event-staff"
  | "lecture"
  | "experience"
  | "freelancer"
  | "revenue-share";

export type LedgerSide = "out" | "in";

export type TaxMethod = "business-3-3" | "tax-invoice" | "other-income-60";

export type PayoutStatus =
  | "collecting"
  | "contract"
  | "ready"
  | "paid"
  | "received";

export type EvidenceItem = {
  id: string;
  label: string;
  hint?: string;
};

export type DocLink = {
  id: string;
  title: string;
  href: string;
  kind: "pdf" | "sign" | "form" | "drive" | "web" | "file";
  note?: string;
};

export type Person = {
  id: string;
  name: string;
  role: string;
  phone?: string;
  note?: string;
};

export type Room = {
  id: string;
  label: string;
  type: "single" | "twin" | "triple" | "quad";
  occupantIds: string[];
};

export type Lodging = {
  name: string;
  address: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  note?: string;
  people: Person[];
  rooms: Room[];
};

export type ScheduleBeat = {
  time: string;
  scene?: string;
  place: string;
  content: string;
};

export type ShootDay = {
  round: number;
  date: string;
  callTime: string;
  shootTime: string;
  lodgingName: string;
  locations: string[];
  meals: { when: string; place: string }[];
  beats: ScheduleBeat[];
};

export type SurveyQuestion = {
  id: string;
  label: string;
  type: "text" | "tel" | "select" | "textarea" | "yesno" | "check" | "scale";
  options?: string[];
  required?: boolean;
  help?: string;
};

export type ContractParty = {
  label: string;
  name: string;
  title?: string;
  phone?: string;
  birth?: string;
};

export type Contract = {
  title: string;
  signedAt?: string;
  periodStart?: string;
  periodEnd?: string;
  workSummary: string[];
  clauses: { title: string; body: string }[];
  partyA: ContractParty;
  partyB: ContractParty;
  signUrl?: string;
  pdfHref?: string;
};

export type PayeeProfile = {
  name: string;
  rrn: string;
  phone?: string;
  bank: string;
  account: string;
  holder: string;
  idImageDataUrl?: string;
  idImageUrl?: string;
  idFileName?: string;
  passportName?: string;
  passportNo?: string;
  passportImageDataUrl?: string;
  passportImageUrl?: string;
  passportFileName?: string;
  signatureDataUrl?: string;
  privacyAgreed: boolean;
  submittedAt?: string;
  source?: "firebase" | "local";
  remoteId?: string;
};

export type Payout = {
  id: string;
  typeId: PayoutTypeId;
  side: LedgerSide;
  title: string;
  partnerName: string;
  partnerRole: string;
  eventName?: string;
  clientName?: string;
  documentNo?: string;
  needsContract?: boolean;
  gross: number;
  taxMethod: TaxMethod;
  days?: number;
  shareRate?: number;
  revenueAmount?: number;
  dueDate: string;
  paidDate?: string;
  collectInsurance?: boolean;
  collectPassport?: boolean;
  periodStart?: string;
  periodEnd?: string;
  workLines?: string[];
  status: PayoutStatus;
  memo?: string;
  hasBusinessReg?: boolean;
  bankHint?: string;
  docs: DocLink[];
  evidence: EvidenceItem[];
  survey: SurveyQuestion[];
  externalFormUrl?: string;
  contract?: Contract;
  lodging?: Lodging;
  schedule?: ShootDay[];
};
