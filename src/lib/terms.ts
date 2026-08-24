/**
 * 의료용어 한글 병기 사전
 *
 * 화면에는 "한글 (English)" 형태로 표시하고, ⓘ 아이콘에 도움말을 붙인다.
 * 표기가 화면마다 어긋나지 않도록 반드시 이 파일만 사용한다.
 */

export type Term = {
  /** 원문 표기 (양식에 인쇄된 그대로) */
  en: string;
  /** 한글 표기 */
  ko: string;
  /** 간호조무사용 쉬운 설명 — 툴팁에 들어간다 */
  help?: string;
};

const TERM_TABLE = {
  // ---------- 평가 항목 ----------
  ADL: {
    en: "ADL",
    ko: "일상생활 수행능력",
    help: "혼자 씻고, 먹고, 옷 입고, 화장실 가는 능력",
  },
  IADL: {
    en: "IADL",
    ko: "도구적 일상생활 수행능력",
    help: "전화·장보기·약 챙겨먹기·돈 관리 등 좀 더 복잡한 일",
  },
  HT_WT: {
    en: "Ht / Wt",
    ko: "키 / 체중",
    help: "입력하면 BMI(체질량지수)가 자동 계산됩니다",
  },
  BMI: {
    en: "BMI",
    ko: "체질량지수",
    help: "체중(kg) ÷ 키(m)². 18.5 미만 저체중, 23 이상 과체중",
  },
  BP: {
    en: "BP",
    ko: "혈압",
    help: "수축기/이완기, 단위 mmHg",
  },
  PR: {
    en: "PR",
    ko: "맥박수",
    help: "1분간 심장이 뛰는 횟수 (회/분)",
  },
  VISION: {
    en: "Vision",
    ko: "시력",
    help: "안경·돋보기 사용 여부도 함께 적습니다",
  },
  HEARING: {
    en: "Hearing",
    ko: "청력",
    help: "보청기 사용 여부도 함께 적습니다",
  },
  INCONTINENCE: {
    en: "Incontinence",
    ko: "요실금 · 대변실금",
    help: "소변이나 대변을 참지 못하고 새는 상태",
  },
  CONSTIPATION: {
    en: "Constipation",
    ko: "변비",
    help: "배변이 어렵거나 횟수가 줄어든 상태",
  },
  NUTRITION: {
    en: "Nutrition",
    ko: "영양상태",
    help: "식사량, 경관식 여부, 최근 체중 변화",
  },
  MOBILITY: {
    en: 'Mobility (timed "up and go" test)',
    ko: "이동능력 (일어나 걷기 검사)",
    help:
      "의자에서 일어나 3m 걸어갔다 돌아와 앉는 시간(초). 13.5초 이상이면 낙상 위험",
  },
  GAIT: {
    en: "Gait",
    ko: "환자 보행상태",
    help: "보행가능 / 보조기 사용 보행가능 / 보행불가능 / 와상상태",
  },
  NEUROPSYCHIATRIC: {
    en: "Neuropsychiatric",
    ko: "신경정신 평가",
    help: "우울·인지·치매행동 관련 평가",
  },
  MENTAL_STATUS: {
    en: "Mental status",
    ko: "의식 · 지남력 상태",
    help: "지금이 언제이고 어디인지 알고 있는지",
  },
  ORIENTED: {
    en: "oriented",
    ko: "지남력 있음",
    help: "시간·장소·사람을 알아봄",
  },
  DISORIENTED: {
    en: "disoriented",
    ko: "지남력 없음",
    help: "시간·장소·사람을 알아보지 못함",
  },
  NOT_ALERT: {
    en: "not alert",
    ko: "의식 저하",
    help: "불러도 반응이 흐리거나 잠에 빠져 있음",
  },
  BPSD: {
    en: "BPSD",
    ko: "치매행동심리증상",
    help: "배회, 망상, 공격성, 밤에 잠 안 자기 등",
  },
  GDS_SF: {
    en: "GDS-SF",
    ko: "노인우울척도 단축형",
    help: "15문항으로 우울 정도를 확인. 8점 이상이면 우울 의심",
  },
  K_MMSE: {
    en: "K-MMSE",
    ko: "간이정신상태검사",
    help: "30점 만점 인지기능(치매) 검사. 24점 이상이 정상 범위",
  },
  DNR: {
    en: "DNR",
    ko: "심폐소생술 거부",
    help:
      "임종 시 심장마사지·인공호흡을 하지 않기로 환자·가족이 미리 정해두는 것",
  },
  MEDICATION: {
    en: "Medication",
    ko: "복용 약물",
  },
  ACTIVE_PROBLEM: {
    en: "Active problem",
    ko: "현재 진행 중인 문제",
    help: "지금 관리해야 하는 문제",
  },
  INACTIVE_PROBLEM: {
    en: "Inactive problem",
    ko: "해결된 문제",
    help: "지난 문제로 지금은 안정된 것",
  },
  MANAGEMENT_PLAN: {
    en: "Management Plan",
    ko: "관리 계획",
    help: "무엇을, 언제까지 할지. 했는지 / 못 했으면 왜",
  },
  LIFE_STYLE: {
    en: "Life style",
    ko: "생활습관",
  },
  MEDICAL_FUNCTIONAL: {
    en: "Medical & Functional",
    ko: "신체 · 기능 평가",
  },

  // ---------- J. 검사 항목 ----------
  CBC: { en: "CBC", ko: "일반혈액검사", help: "빈혈 · 감염 · 혈액 이상" },
  ESR: { en: "ESR", ko: "적혈구침강속도", help: "몸속 염증 정도" },
  UA: { en: "UA", ko: "소변검사", help: "요로감염 · 단백뇨 · 혈뇨" },
  STOOL: { en: "Stool", ko: "대변검사", help: "장출혈 · 기생충 · 감염" },
  TP_ALB: {
    en: "T.P / Alb",
    ko: "총단백 / 알부민",
    help: "영양상태를 봅니다. 낮으면 욕창·부종이 잘 생깁니다",
  },
  FBS: { en: "FBS", ko: "공복혈당", help: "당뇨 확인" },
  BUN_CR: { en: "BUN / Cr", ko: "요소질소 / 크레아티닌", help: "콩팥(신장) 기능" },
  URIC_ACID: { en: "Uric Acid", ko: "요산", help: "통풍" },
  T_BILIRUBIN: {
    en: "T.Bilirubin",
    ko: "총빌리루빈",
    help: "황달 · 간담도 이상",
  },
  AST_ALT: { en: "AST / ALT", ko: "간효소 수치", help: "간 손상 여부" },
  ALP: {
    en: "ALP",
    ko: "알칼리인산분해효소",
    help: "간 · 담도 · 뼈 질환",
  },
  T_CHOL: { en: "T.Chol", ko: "총콜레스테롤", help: "고지혈증" },
  TSH_T4: {
    en: "TSH / T4",
    ko: "갑상선 기능 검사",
    help: "갑상선 기능 저하 또는 과다",
  },
  EKG: { en: "EKG", ko: "심전도", help: "부정맥 · 심장 이상" },
  CHEST_PA: {
    en: "Chest PA",
    ko: "흉부 X선 (정면)",
    help: "폐렴 · 결핵 · 심장 크기",
  },
  LS_SPINE: {
    en: "L-S Spine",
    ko: "허리(요천추) X선",
    help: "척추 압박골절 · 협착",
  },
  KNEE: { en: "Knee", ko: "무릎 X선", help: "무릎 관절염" },
};

export type TermKey = keyof typeof TERM_TABLE;

/**
 * 값 타입을 Term 으로 넓혀 둔다.
 * (as const 로 리터럴까지 좁히면 help 가 없는 항목에서 접근이 막힌다)
 */
export const TERMS: Record<TermKey, Term> = TERM_TABLE;

export function term(key: TermKey): Term {
  return TERMS[key];
}

/**
 * "한글 (English)" 형태의 라벨.
 * 한글과 원문이 같은 경우(한글 항목)에는 한글만 반환한다.
 */
export function termLabel(key: TermKey): string {
  const t = TERMS[key];
  return t.ko === t.en ? t.ko : `${t.ko} (${t.en})`;
}
