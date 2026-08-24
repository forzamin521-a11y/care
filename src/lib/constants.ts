/**
 * 포괄평가기록부 양식에 인쇄된 선택 항목들.
 * 원본 양식(references)의 표기·순서를 그대로 유지한다.
 */

import type { TermKey } from "./terms";

// -------------------------------------------------------------
// A. 진단명(기존질병) — 체크리스트 15종
//    원본 표의 배열 순서를 그대로 따른다 (4열 × 4행)
// -------------------------------------------------------------
export type DiagnosisKey =
  | "hypertension"
  | "diabetes"
  | "hip_arthritis"
  | "osteoporosis"
  | "stroke"
  | "coronary"
  | "heart_failure"
  | "dementia"
  | "arrhythmia"
  | "copd"
  | "cancer"
  | "parkinson"
  | "cataract"
  | "thyroid"
  | "other";

export const DIAGNOSES: { key: DiagnosisKey; label: string; en?: string }[] = [
  { key: "hypertension", label: "고혈압" },
  { key: "diabetes", label: "당뇨" },
  { key: "hip_arthritis", label: "고관절염" },
  { key: "osteoporosis", label: "골다공증" },
  { key: "stroke", label: "뇌졸중" },
  { key: "coronary", label: "관상동맥질환" },
  { key: "heart_failure", label: "심부전" },
  { key: "dementia", label: "치매" },
  { key: "arrhythmia", label: "부정맥" },
  { key: "copd", label: "만성폐쇄성폐질환", en: "COPD" },
  { key: "cancer", label: "암" },
  { key: "parkinson", label: "파킨슨병" },
  { key: "cataract", label: "백내장" },
  { key: "thyroid", label: "갑상선기능 이상 (↑↓)" },
  { key: "other", label: "기타" },
];

// -------------------------------------------------------------
// F. Medication — 약물 12계열
// -------------------------------------------------------------
export type MedicationCategory =
  | "antihypertensive"
  | "diuretic"
  | "antidiabetic"
  | "antidepressant"
  | "sedative"
  | "analgesic"
  | "antihistamine"
  | "vasodilator"
  | "vasoconstrictor"
  | "narcotic"
  | "herbal"
  | "other";

export const MEDICATION_CATEGORIES: {
  key: MedicationCategory;
  label: string;
  help?: string;
}[] = [
  { key: "antihypertensive", label: "고혈압제", help: "혈압을 낮추는 약" },
  { key: "diuretic", label: "이뇨제", help: "소변으로 수분을 빼내는 약" },
  { key: "antidiabetic", label: "당뇨약", help: "혈당을 낮추는 약" },
  { key: "antidepressant", label: "항우울제" },
  { key: "sedative", label: "안정제", help: "불안·불면에 쓰는 약" },
  { key: "analgesic", label: "진통제" },
  { key: "antihistamine", label: "항히스타민제", help: "알레르기·콧물에 쓰는 약" },
  { key: "vasodilator", label: "혈관확장제", help: "혈관을 넓혀주는 약" },
  { key: "vasoconstrictor", label: "혈관수축제", help: "혈관을 좁혀 혈압을 올리는 약" },
  { key: "narcotic", label: "마약류", help: "마약성 진통제 등" },
  { key: "herbal", label: "한약" },
  { key: "other", label: "기타" },
];

// -------------------------------------------------------------
// J. Initial Lab & X-ray — 필수 17종
//    code 는 DB labs.code 와 일치, term 은 한글 병기용 키
// -------------------------------------------------------------
export const LAB_ITEMS: { code: string; term: TermKey; unit?: string }[] = [
  { code: "CBC", term: "CBC" },
  { code: "ESR", term: "ESR", unit: "mm/hr" },
  { code: "UA", term: "UA" },
  { code: "STOOL", term: "STOOL" },
  { code: "TP_ALB", term: "TP_ALB", unit: "g/dL" },
  { code: "FBS", term: "FBS", unit: "mg/dL" },
  { code: "BUN_CR", term: "BUN_CR", unit: "mg/dL" },
  { code: "URIC_ACID", term: "URIC_ACID", unit: "mg/dL" },
  { code: "T_BILIRUBIN", term: "T_BILIRUBIN", unit: "mg/dL" },
  { code: "AST_ALT", term: "AST_ALT", unit: "IU/L" },
  { code: "ALP", term: "ALP", unit: "IU/L" },
  { code: "T_CHOL", term: "T_CHOL", unit: "mg/dL" },
  { code: "TSH_T4", term: "TSH_T4" },
  { code: "EKG", term: "EKG" },
  { code: "CHEST_PA", term: "CHEST_PA" },
  { code: "LS_SPINE", term: "LS_SPINE" },
  { code: "KNEE", term: "KNEE" },
];

// -------------------------------------------------------------
// D. 환자 보행상태 — 4택 1
// -------------------------------------------------------------
export type GaitStatus = "independent" | "assistive" | "unable" | "bedridden";

export const GAIT_STATUS: { key: GaitStatus; label: string; help?: string }[] = [
  { key: "independent", label: "보행가능", help: "혼자 걸을 수 있음" },
  { key: "assistive", label: "보조기 사용 보행가능", help: "지팡이·워커 등을 쓰면 걸을 수 있음" },
  { key: "unable", label: "보행불가능", help: "걸을 수 없음 (휠체어 이동)" },
  { key: "bedridden", label: "와상상태", help: "침상에 누워 지냄" },
];

// -------------------------------------------------------------
// E. Mental status — 3택 1
// -------------------------------------------------------------
export type MentalStatus = "oriented" | "disoriented" | "not_alert";

export const MENTAL_STATUS: {
  key: MentalStatus;
  label: string;
  en: string;
  help: string;
}[] = [
  {
    key: "oriented",
    label: "지남력 있음",
    en: "oriented",
    help: "시간·장소·사람을 알아봄",
  },
  {
    key: "disoriented",
    label: "지남력 없음",
    en: "disoriented",
    help: "시간·장소·사람을 알아보지 못함",
  },
  {
    key: "not_alert",
    label: "의식 저하",
    en: "not alert",
    help: "불러도 반응이 흐리거나 잠에 빠져 있음",
  },
];

// -------------------------------------------------------------
// C. Life style — 자주 쓰는 값 (원클릭 칩)
// -------------------------------------------------------------
export const LIFESTYLE_PRESETS = {
  exercise: ["가벼운 운동", "산책 정도", "운동 안 함", "침상 운동만"],
  sleep: ["잘 주무심", "자주 깨심", "밤에 잠 못 드심", "낮밤이 바뀌심"],
  education: ["무학", "초등", "중등", "고등", "대학 이상", "미상"],
  alcohol: ["해당없음", "금주", "주 1~2회", "매일"],
  smoking: ["해당없음", "금연", "흡연 중"],
  diet: ["일반식", "죽식", "경관식", "당뇨식", "저염식", "연하도움식"],
} as const;

// -------------------------------------------------------------
// 평가 종류
// -------------------------------------------------------------
export type AssessmentKind = "initial" | "periodic" | "ad_hoc";

export const ASSESSMENT_KINDS: {
  key: AssessmentKind;
  label: string;
  help: string;
}[] = [
  { key: "initial", label: "최초평가", help: "입소 시 처음 실시하는 평가" },
  { key: "periodic", label: "정기평가", help: "정해진 주기(기본 6개월)마다 실시" },
  { key: "ad_hoc", label: "수시평가", help: "상태가 변했을 때 추가로 실시" },
];

/** 정기평가 주기 (개월) — 병원 규정에 맞게 조정 */
export const PERIODIC_INTERVAL_MONTHS = 6;

// -------------------------------------------------------------
// 이상치 경고 기준
// -------------------------------------------------------------
export const VITAL_ALERTS = {
  /** 수축기 혈압 */
  sbp: { low: 90, high: 180 },
  /** 이완기 혈압 */
  dbp: { low: 60, high: 110 },
  /** 맥박 */
  pulse: { low: 50, high: 120 },
  /** BMI */
  bmi: { low: 18.5, high: 25 },
  /** 3개월간 체중 감소율(%) — 이 이상이면 영양 확인 */
  weightLossPercent: 5,
} as const;
