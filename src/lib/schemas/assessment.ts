import { z } from "zod";
import type {
  DiagnosisKey,
  GaitStatus,
  MedicationCategory,
  MentalStatus,
} from "@/lib/constants";

/**
 * 포괄평가기록부 A~J 섹션의 데이터 구조.
 *
 * 저장 원칙
 *   · 이 구조 전체가 assessments.data (jsonb) 에 들어간다 — 단일 진실 공급원
 *   · 차트·경고에 쓰는 값(키/체중/혈압/맥박)만 assessments 의 별도 컬럼으로 미러링
 *   · 평가를 "완료" 처리할 때 F(약물) · H(문제목록) · J(검사) 를
 *     medications / problems / labs 표로 펼쳐 넣는다 (조회·통계용 파생 데이터)
 *   · ADL · IADL · GDS-SF · K-MMSE · TUG 점수는 scale_results 표에서 온다
 */

const text = z.string().trim().default("");

// ---------- A. 진단명(기존질병) ----------
const sectionA = z.object({
  admitReason: text, // 입소이유 (서술)
  clinicalDiagnosis: text, // 의료기관에 의한 진단명 (서술)
  diagnoses: z.array(z.string()).default([]), // 체크리스트 15종
  diagnosisOther: text, // "기타" 선택 시 내용
});

// ---------- B. 과거력 ----------
const sectionB = z.object({
  surgery: text, // 1) 주요 수술
  admission: text, // 2) 급성기 병동 입원
  allergy: text, // 3) 알레르기
});

// ---------- C. Life style ----------
const sectionC = z.object({
  exercise: text,
  sleep: text,
  education: text, // 교육정도
  alcohol: text,
  smoking: text,
  diet: text, // 식이
});

const numeric = z
  .union([z.number(), z.string(), z.null()])
  .transform((v) => {
    if (v === null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .nullable()
  .default(null);

// ---------- D. Medical & Functional ----------
const sectionD = z.object({
  heightCm: numeric,
  weightKg: numeric,
  sbp: numeric, // 수축기 혈압
  dbp: numeric, // 이완기 혈압
  pulse: numeric, // PR
  vision: text,
  hearing: text,
  incontinence: text, // 요실금
  constipation: text, // 변비
  nutrition: text, // 영양상태
  gait: z.string().nullable().default(null), // 환자 보행상태 4택
});

// ---------- E. Neuropsychiatric ----------
const sectionE = z.object({
  mentalStatus: z.string().nullable().default(null), // oriented / disoriented / not_alert
  bpsd: text, // 치매행동심리증상
  note: text,
});

// ---------- F. Medication ----------
const medicationItem = z.object({
  category: z.string(),
  drugName: text,
  note: text,
});

const sectionF = z.object({
  items: z.array(medicationItem).default([]),
});

// ---------- G. 사전치료지시 ----------
const triState = z.boolean().nullable().default(null);

const sectionG = z.object({
  dnr: triState, // 심폐소생술 거부
  refuseAdmission: triState, // 입원 거부
  refuseTubeFeeding: triState, // 영양관 공급 거부
  note: text,
  agreedBy: text, // 결정한 사람 (환자/보호자 이름·관계)
  agreedOn: text, // YYYY-MM-DD
});

// ---------- H. Problem list ----------
const sectionH = z.object({
  active: z.array(z.string()).default([]),
  inactive: z.array(z.string()).default([]),
});

// ---------- I. Management Plan ----------
const planRow = z.object({
  planDate: text, // 일자 YYYY-MM-DD
  content: text, // 주요 관리 사항
  done: z.boolean().nullable().default(null), // 완수 여부
  undoneReason: text, // 불이행 이유
});

const sectionI = z.object({
  rows: z.array(planRow).default([]),
});

// ---------- J. Initial Lab & X-ray ----------
const labValue = z.object({
  value: text,
  takenOn: text,
  abnormal: z.boolean().default(false),
});

const sectionJ = z.object({
  items: z.record(z.string(), labValue).default({}),
  note: text, // 참고사항
});

// ---------- 하단 ----------
const footer = z.object({
  doctorName: text, // 의사 서명란
  writtenOn: text, // 작성일자
});

export const assessmentDataSchema = z.object({
  a: sectionA.prefault({}),
  b: sectionB.prefault({}),
  c: sectionC.prefault({}),
  d: sectionD.prefault({}),
  e: sectionE.prefault({}),
  f: sectionF.prefault({}),
  g: sectionG.prefault({}),
  h: sectionH.prefault({}),
  i: sectionI.prefault({}),
  j: sectionJ.prefault({}),
  footer: footer.prefault({}),
});

export type AssessmentData = z.infer<typeof assessmentDataSchema>;

export type SectionKey = keyof AssessmentData;

/** 빈 평가 데이터 */
export function emptyAssessmentData(): AssessmentData {
  return assessmentDataSchema.parse({});
}

/**
 * DB 에서 읽은 jsonb 를 안전하게 파싱한다.
 * 양식이 나중에 바뀌어도 예전 기록이 깨지지 않도록 실패 시 빈 값으로 채운다.
 */
export function parseAssessmentData(raw: unknown): AssessmentData {
  const result = assessmentDataSchema.safeParse(raw ?? {});
  return result.success ? result.data : emptyAssessmentData();
}

/** 타입 좁히기용 헬퍼 — 상수 목록과 맞춰 쓴다 */
export type TypedAssessmentData = Omit<
  AssessmentData,
  "a" | "d" | "e" | "f"
> & {
  a: Omit<AssessmentData["a"], "diagnoses"> & { diagnoses: DiagnosisKey[] };
  d: Omit<AssessmentData["d"], "gait"> & { gait: GaitStatus | null };
  e: Omit<AssessmentData["e"], "mentalStatus"> & {
    mentalStatus: MentalStatus | null;
  };
  f: { items: { category: MedicationCategory; drugName: string; note: string }[] };
};

// =============================================================
// 섹션 정의 — 왼쪽 네비게이션과 완료 표시에 쓴다
// =============================================================

export type SectionMeta = {
  key: SectionKey;
  /** 양식에 인쇄된 기호 */
  mark: string;
  title: string;
  /** 원문 표기 */
  titleEn?: string;
};

export const SECTIONS: SectionMeta[] = [
  { key: "a", mark: "A", title: "진단명 (기존질병)" },
  { key: "b", mark: "B", title: "과거력" },
  { key: "c", mark: "C", title: "생활습관", titleEn: "Life style" },
  {
    key: "d",
    mark: "D",
    title: "신체 · 기능 평가",
    titleEn: "Medical & Functional",
  },
  {
    key: "e",
    mark: "E",
    title: "신경정신 평가",
    titleEn: "Neuropsychiatric",
  },
  { key: "f", mark: "F", title: "복용 약물", titleEn: "Medication" },
  { key: "g", mark: "G", title: "사전치료지시" },
  { key: "h", mark: "H", title: "문제 목록", titleEn: "Problem list" },
  { key: "i", mark: "I", title: "관리 계획", titleEn: "Management Plan" },
  { key: "j", mark: "J", title: "검사", titleEn: "Initial Lab & X-ray" },
];

/**
 * 섹션에 내용이 하나라도 채워졌는지.
 * 왼쪽 네비의 ● / ○ 표시에 쓴다.
 */
export function isSectionFilled(
  data: AssessmentData,
  key: SectionKey
): boolean {
  const section = data[key];
  if (!section) return false;

  return Object.entries(section).some(([, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (typeof value === "boolean") return true;
    if (typeof value === "number") return true;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return false;
  });
}

/** BMI 계산 — 소수점 1자리 */
export function calcBmi(
  heightCm: number | null,
  weightKg: number | null
): number | null {
  if (!heightCm || !weightKg || heightCm <= 0) return null;
  const meters = heightCm / 100;
  return Math.round((weightKg / (meters * meters)) * 10) / 10;
}
