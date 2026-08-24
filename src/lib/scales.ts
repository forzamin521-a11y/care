/**
 * 평가척도 정의 · 채점 로직
 *
 * 세 가지 실행 모드가 모두 이 정의를 공유한다.
 *   web        — 웹에서 한 문항씩 진행 (문항이 있는 척도만)
 *   score_only — 총점 / 영역 점수만 입력
 *   paper      — 빈 설문지를 A4 로 인쇄해 현장에서 실시 → 이후 score_only 로 입력
 *
 * ⚠ K-MMSE 는 저작권(PAR 독점 라이선스) 문제로 문항 텍스트를 담지 않는다.
 *    영역별 점수 입력만 지원한다.
 */

export type ScaleCode = "K_ADL" | "K_IADL" | "SGDS_K" | "K_MMSE" | "TUG";

export type Severity = "ok" | "warn" | "danger";

export type EntryMode = "web" | "score_only" | "paper";

/** 문항 하나 */
export type ScaleItem = {
  no: number;
  /** 문항 본문 */
  text: string;
  /** 간호조무사용 보충 설명 (선택) */
  hint?: string;
  /** 역채점 문항 (SGDS-K 에서 "아니오"가 1점) */
  reverse?: boolean;
};

/** 응답 선택지 */
export type ScaleChoice = {
  value: number;
  label: string;
  hint?: string;
};

/** K-MMSE 처럼 영역별 점수만 받는 척도의 영역 */
export type ScaleDomain = {
  key: string;
  label: string;
  /** 해당 영역 만점 */
  max: number;
  hint?: string;
};

export type ScoreBand = {
  /** 이 구간의 최소값 (포함) */
  min: number;
  /** 이 구간의 최대값 (포함) */
  max: number;
  label: string;
  severity: Severity;
};

type BaseDef = {
  code: ScaleCode;
  /** 화면에 쓰는 짧은 이름 */
  name: string;
  /** 원어 표기 */
  nameEn: string;
  /** 무엇을 보는 검사인지 — 간호조무사용 한 줄 설명 */
  purpose: string;
  /** 점수 표기 단위 */
  unit: string;
  /** 웹 진행을 지원하는가 */
  webEnabled: boolean;
  /** 웹 진행을 지원하지 않는 이유 (K-MMSE) */
  webDisabledReason?: string;
  /** 채점 안내 — 인쇄물 하단에 넣는다 */
  scoringNote: string;
  /** 출처 표기 */
  source: string;
  bands: ScoreBand[];
};

export type ItemScaleDef = BaseDef & {
  kind: "items";
  items: ScaleItem[];
  choices: ScaleChoice[];
  /** K-IADL 의 "해당없음" */
  allowNotApplicable: boolean;
  /** 점수만 입력할 때 허용 범위 */
  scoreRange: { min: number; max: number; step: number };
};

export type DomainScaleDef = BaseDef & {
  kind: "domains";
  domains: ScaleDomain[];
  scoreRange: { min: number; max: number; step: number };
};

export type NumericScaleDef = BaseDef & {
  kind: "numeric";
  scoreRange: { min: number; max: number; step: number };
};

export type ScaleDef = ItemScaleDef | DomainScaleDef | NumericScaleDef;

// =============================================================
// K-ADL — 한국형 일상생활활동 측정도구
// 7문항 × 3점 척도 = 7~21점. 7점이 완전자립.
// =============================================================
export const K_ADL: ItemScaleDef = {
  kind: "items",
  code: "K_ADL",
  name: "일상생활 수행능력",
  nameEn: "K-ADL",
  purpose: "혼자 씻고, 먹고, 옷 입고, 화장실 가는 능력을 봅니다.",
  unit: "점",
  webEnabled: true,
  scoringNote:
    "7문항 각각 ① 1점 · ② 2점 · ③ 3점으로 더합니다. 7점이면 완전자립이고, 점수가 높을수록 도움이 많이 필요합니다. (7~21점)",
  source: "원장원 등, 한국형 일상생활활동 측정도구(K-ADL)",
  items: [
    {
      no: 1,
      text: "옷 입기",
      hint: "속옷·겉옷을 입고 벗기, 단추 채우기",
    },
    {
      no: 2,
      text: "세수하기",
      hint: "세수, 양치질, 머리 감기",
    },
    {
      no: 3,
      text: "목욕하기",
      hint: "욕조에 들어가 몸을 씻거나 다른 방법으로 씻기",
    },
    {
      no: 4,
      text: "식사하기",
      hint: "음식이 준비되어 있을 때 혼자 먹기",
    },
    {
      no: 5,
      text: "체위 변경 (이동)",
      hint: "잠자리에서 일어나 방 밖으로 나오기",
    },
    {
      no: 6,
      text: "화장실 사용",
      hint: "화장실에 가서 대소변 후 닦고 옷을 입기",
    },
    {
      no: 7,
      text: "대소변 조절",
      hint: "대변과 소변을 참고 조절하기",
    },
  ],
  choices: [
    { value: 1, label: "① 완전자립", hint: "도움 없이 혼자 할 수 있음" },
    { value: 2, label: "② 부분도움", hint: "약간의 도움이 필요함" },
    { value: 3, label: "③ 완전도움", hint: "다른 사람의 완전한 도움이 필요함" },
  ],
  allowNotApplicable: false,
  scoreRange: { min: 7, max: 21, step: 1 },
  // K-ADL 은 공식 절단점이 정해져 있지 않다. 아래는 판독을 돕는 참고 구간.
  bands: [
    { min: 7, max: 7, label: "완전자립", severity: "ok" },
    { min: 8, max: 13, label: "부분 의존 — 일부 도움 필요", severity: "warn" },
    { min: 14, max: 21, label: "상당한 의존 — 도움이 많이 필요", severity: "danger" },
  ],
};

// =============================================================
// K-IADL — 한국형 도구적 일상생활활동 측정도구
// 10문항 × 0~3점 + "해당없음". 해당 문항의 평균으로 채점. 절단점 0.43.
// =============================================================
export const K_IADL: ItemScaleDef = {
  kind: "items",
  code: "K_IADL",
  name: "도구적 일상생활 수행능력",
  nameEn: "K-IADL",
  purpose:
    "전화·장보기·약 챙겨먹기·돈 관리처럼 조금 더 복잡한 일을 할 수 있는지 봅니다.",
  unit: "평균점",
  webEnabled: true,
  scoringNote:
    "각 문항 0~3점. '해당없음'은 계산에서 제외합니다. (해당 문항 점수 합계) ÷ (해당 문항 수) = 평균 점수. 평균 0.43점 이상이면 기능장애를 의심합니다.",
  source: "강수진·원장원 등, 한국형 도구적 일상생활활동 측정도구(K-IADL)",
  items: [
    { no: 1, text: "몸 단장", hint: "머리 빗기, 화장, 면도 등" },
    { no: 2, text: "집안일", hint: "청소, 정리정돈" },
    { no: 3, text: "식사 준비", hint: "재료를 준비해 음식을 만들기" },
    { no: 4, text: "빨래하기", hint: "세탁기 사용 또는 손빨래" },
    { no: 5, text: "근거리 외출", hint: "걸어서 갈 수 있는 거리의 외출" },
    { no: 6, text: "교통수단 이용", hint: "버스·지하철·택시 타기" },
    { no: 7, text: "물건 사기 (쇼핑)", hint: "가게에서 필요한 물건 사기" },
    { no: 8, text: "금전 관리", hint: "돈 계산, 은행 업무, 공과금 내기" },
    { no: 9, text: "전화 사용", hint: "전화번호를 찾아 전화 걸기" },
    { no: 10, text: "약 챙겨먹기", hint: "정해진 시간에 정해진 양의 약 먹기" },
  ],
  choices: [
    { value: 0, label: "0 혼자 가능", hint: "도움 없이 할 수 있음" },
    { value: 1, label: "1 약간 도움", hint: "약간의 도움이 필요함" },
    { value: 2, label: "2 많은 도움", hint: "많은 도움이 필요함" },
    { value: 3, label: "3 전혀 불가", hint: "전혀 할 수 없음" },
  ],
  allowNotApplicable: true,
  scoreRange: { min: 0, max: 3, step: 0.01 },
  bands: [
    { min: 0, max: 0.42, label: "정상 범위", severity: "ok" },
    { min: 0.43, max: 1.49, label: "기능장애 의심 (0.43점 이상)", severity: "warn" },
    { min: 1.5, max: 3, label: "기능장애 — 도움이 많이 필요", severity: "danger" },
  ],
};

// =============================================================
// SGDS-K / GDS-SF — 단축형 노인우울척도
// 15문항 예/아니오. 1·5·7·11·13번은 "아니오"가 1점(역채점).
// 8점 이상 우울 의심.
// =============================================================
export const SGDS_K: ItemScaleDef = {
  kind: "items",
  code: "SGDS_K",
  name: "노인우울척도 단축형",
  nameEn: "GDS-SF / SGDS-K",
  purpose: "15개 질문으로 우울한 정도를 확인합니다.",
  unit: "점",
  webEnabled: true,
  scoringNote:
    "★ 표시가 붙은 문항(1·5·7·11·13번)은 '아니오'라고 답하면 1점, 나머지 문항은 '예'라고 답하면 1점입니다. 총점 15점 중 8점 이상이면 우울을 의심하여 전문의 상담을 권합니다.",
  source: "한국판 단축형 노인우울척도(SGDS-K) / GDS-SF 15문항",
  items: [
    { no: 1, text: "본인의 삶에 대체로 만족하십니까?", reverse: true },
    { no: 2, text: "최근에 활동이나 관심거리가 줄었습니까?" },
    { no: 3, text: "삶이 공허하다고 느끼십니까?" },
    { no: 4, text: "자주 싫증을 느끼십니까?" },
    { no: 5, text: "기분 좋게 사시는 편입니까?", reverse: true },
    { no: 6, text: "좋지 않은 일이 닥쳐올까 두렵습니까?" },
    { no: 7, text: "대체로 행복하다고 느끼십니까?", reverse: true },
    { no: 8, text: "자주 무기력함을 느끼십니까?" },
    { no: 9, text: "외출보다는 집안에 있기를 좋아하십니까?" },
    { no: 10, text: "다른 사람들보다 기억력이 떨어진다고 느끼십니까?" },
    { no: 11, text: "살아있다는 사실이 기쁘십니까?", reverse: true },
    { no: 12, text: "본인의 삶이 가치가 없다고 느끼십니까?" },
    { no: 13, text: "생활에 활력이 넘치십니까?", reverse: true },
    { no: 14, text: "본인의 현실이 절망적이라고 느끼십니까?" },
    { no: 15, text: "다른 사람들이 대체로 본인보다 낫다고 느끼십니까?" },
  ],
  choices: [
    { value: 1, label: "예" },
    { value: 0, label: "아니오" },
  ],
  allowNotApplicable: false,
  scoreRange: { min: 0, max: 15, step: 1 },
  bands: [
    { min: 0, max: 7, label: "정상 범위", severity: "ok" },
    { min: 8, max: 9, label: "우울 의심 (8점 이상) — 전문의 상담 권유", severity: "warn" },
    { min: 10, max: 15, label: "우울 가능성 높음 — 전문의 상담 권유", severity: "danger" },
  ],
};

// =============================================================
// K-MMSE — 한국판 간이정신상태검사
// ⚠ 저작권(PAR 독점 라이선스)으로 문항 텍스트를 담지 않는다.
//    병원 정식 용지로 검사한 뒤 영역별 점수만 입력한다. 합계 30점.
// =============================================================
export const K_MMSE: DomainScaleDef = {
  kind: "domains",
  code: "K_MMSE",
  name: "간이정신상태검사",
  nameEn: "K-MMSE",
  purpose: "30점 만점으로 인지기능(치매 여부)을 확인합니다.",
  unit: "점",
  webEnabled: false,
  webDisabledReason:
    "MMSE 는 저작권이 있는 검사도구입니다. 문항을 앱에 넣지 않고, 병원에서 보유한 정식 용지로 검사한 뒤 영역별 점수만 입력합니다.",
  scoringNote:
    "영역별 점수를 입력하면 총점(30점)이 자동 계산됩니다. 24점 이상 정상 / 20~23점 경증 / 10~19점 중등도 / 10점 미만 중증.",
  source: "K-MMSE (병원 보유 정식 용지 사용)",
  domains: [
    { key: "orientation_time", label: "시간 지남력", max: 5, hint: "연도·계절·날짜·요일 등" },
    { key: "orientation_place", label: "장소 지남력", max: 5, hint: "나라·지역·건물·층 등" },
    { key: "registration", label: "기억 등록", max: 3, hint: "단어 3개 따라 말하기" },
    { key: "attention", label: "주의집중 및 계산", max: 5, hint: "100에서 7씩 빼기 등" },
    { key: "recall", label: "기억 회상", max: 3, hint: "앞서 들은 단어 3개 다시 말하기" },
    {
      key: "language",
      label: "언어 기능",
      max: 8,
      hint: "이름대기 2 · 따라 말하기 1 · 명령 수행 3 · 읽기 1 · 쓰기 1",
    },
    { key: "visuospatial", label: "시공간 구성", max: 1, hint: "겹친 오각형 그리기" },
  ],
  scoreRange: { min: 0, max: 30, step: 1 },
  bands: [
    { min: 24, max: 30, label: "정상 범위", severity: "ok" },
    { min: 20, max: 23, label: "경증 인지저하 의심", severity: "warn" },
    { min: 10, max: 19, label: "중등도 인지저하", severity: "danger" },
    { min: 0, max: 9, label: "중증 인지저하", severity: "danger" },
  ],
};

// =============================================================
// TUG — 일어나 걷기 검사
// 초 단위. 13.5초 이상이면 낙상 위험.
// =============================================================
export const TUG: NumericScaleDef = {
  kind: "numeric",
  code: "TUG",
  name: "일어나 걷기 검사",
  nameEn: 'Mobility — timed "up and go" test',
  purpose:
    "의자에서 일어나 3m 걸어갔다 돌아와 앉는 데 걸리는 시간을 재서 낙상 위험을 봅니다.",
  unit: "초",
  webEnabled: false,
  webDisabledReason: "직접 시간을 재는 검사입니다. 측정한 초를 입력하세요.",
  scoringNote:
    "의자에 앉은 상태에서 시작해 3m 지점까지 걸어갔다가 돌아와 다시 앉을 때까지의 시간을 초 단위로 재세요. 13.5초 이상이면 낙상 위험이 있습니다.",
  source: "Timed Up and Go test",
  scoreRange: { min: 0, max: 180, step: 0.1 },
  bands: [
    { min: 0, max: 9.9, label: "정상 범위", severity: "ok" },
    { min: 10, max: 13.4, label: "주의 — 이동능력 저하 시작", severity: "warn" },
    { min: 13.5, max: 180, label: "낙상 위험 (13.5초 이상)", severity: "danger" },
  ],
};

export const SCALES: Record<ScaleCode, ScaleDef> = {
  K_ADL,
  K_IADL,
  SGDS_K,
  K_MMSE,
  TUG,
};

/**
 * 종이 설문지로 인쇄할 수 있는 척도.
 * K-MMSE 는 저작권 때문에, TUG 는 설문이 아니라서 제외한다.
 */
export const PRINTABLE_SCALES: ScaleCode[] = ["K_ADL", "K_IADL", "SGDS_K"];

export const SCALE_ORDER: ScaleCode[] = [
  "K_ADL",
  "K_IADL",
  "SGDS_K",
  "K_MMSE",
  "TUG",
];

export function getScale(code: ScaleCode): ScaleDef {
  return SCALES[code];
}

export function isScaleCode(value: string): value is ScaleCode {
  return value in SCALES;
}

// =============================================================
// 채점
// =============================================================

/** 화면 요약용 — 저장된 척도 결과 한 건 */
export type ScaleSummary = {
  code: ScaleCode;
  display: string;
  interpretation: string;
  severity: Severity;
  measuredAt: string;
  entryMode: EntryMode;
} | null;

export type ScoreOutcome = {
  /** 최종 점수 (K-IADL 은 평균) */
  total: number;
  /** 화면 표기용 문자열 — 예 "15 / 21점", "0.60 평균점" */
  display: string;
  interpretation: string;
  severity: Severity;
  /** 영역별 점수 (K-MMSE) */
  subscores?: Record<string, number>;
  /** 응답이 덜 채워졌으면 남은 문항 수 */
  unanswered?: number;
};

/** 점수에 해당하는 구간을 찾는다 */
export function findBand(def: ScaleDef, total: number): ScoreBand {
  const band = def.bands.find((b) => total >= b.min && total <= b.max);
  if (band) return band;
  // 범위를 벗어나면 가장 가까운 구간으로 (방어적)
  return total < def.bands[0].min
    ? def.bands[0]
    : def.bands[def.bands.length - 1];
}

/** "해당없음" 표시값 */
export const NOT_APPLICABLE = -1;

export type ItemAnswers = Record<number, number>;

/**
 * 문항형 척도 채점.
 * K-ADL / SGDS-K → 합계, K-IADL → 해당 문항 평균
 */
export function scoreItemScale(
  def: ItemScaleDef,
  answers: ItemAnswers
): ScoreOutcome {
  let sum = 0;
  let counted = 0;
  let unanswered = 0;

  for (const item of def.items) {
    const raw = answers[item.no];

    if (raw === undefined || raw === null) {
      unanswered += 1;
      continue;
    }
    if (def.allowNotApplicable && raw === NOT_APPLICABLE) {
      continue; // 평균 계산에서 제외
    }

    // SGDS-K 역채점: "아니오"(0)를 고른 경우 1점
    const point =
      def.code === "SGDS_K" && item.reverse ? (raw === 0 ? 1 : 0) : raw;

    sum += point;
    counted += 1;
  }

  const isAverage = def.code === "K_IADL";
  const total = isAverage
    ? counted > 0
      ? Math.round((sum / counted) * 100) / 100
      : 0
    : sum;

  const band = findBand(def, total);

  const display = isAverage
    ? `${total.toFixed(2)} ${def.unit} (해당 ${counted}문항)`
    : `${total} / ${def.scoreRange.max}${def.unit}`;

  return {
    total,
    display,
    interpretation: band.label,
    severity: band.severity,
    unanswered: unanswered > 0 ? unanswered : undefined,
  };
}

/** K-MMSE — 영역별 점수 합산 */
export function scoreDomainScale(
  def: DomainScaleDef,
  subscores: Record<string, number>
): ScoreOutcome {
  let total = 0;
  const clean: Record<string, number> = {};

  for (const domain of def.domains) {
    const raw = Number(subscores[domain.key] ?? 0);
    const value = Number.isFinite(raw)
      ? Math.min(Math.max(Math.trunc(raw), 0), domain.max)
      : 0;
    clean[domain.key] = value;
    total += value;
  }

  const band = findBand(def, total);

  return {
    total,
    display: `${total} / ${def.scoreRange.max}${def.unit}`,
    interpretation: band.label,
    severity: band.severity,
    subscores: clean,
  };
}

/** TUG 등 숫자 하나만 받는 척도 */
export function scoreNumericScale(
  def: NumericScaleDef,
  value: number
): ScoreOutcome {
  const total = Math.round(value * 10) / 10;
  const band = findBand(def, total);

  return {
    total,
    display: `${total}${def.unit}`,
    interpretation: band.label,
    severity: band.severity,
  };
}

/** 총점만 아는 경우 (종이로 실시한 뒤 점수만 입력) */
export function scoreFromTotal(def: ScaleDef, total: number): ScoreOutcome {
  const clamped = Math.min(
    Math.max(total, def.scoreRange.min),
    def.scoreRange.max
  );
  const band = findBand(def, clamped);
  const isAverage = def.code === "K_IADL";

  return {
    total: clamped,
    display: isAverage
      ? `${clamped.toFixed(2)} ${def.unit}`
      : `${clamped}${def.kind === "numeric" ? "" : ` / ${def.scoreRange.max}`}${def.unit}`,
    interpretation: band.label,
    severity: band.severity,
  };
}

/**
 * 두 회차 점수를 비교한다.
 * 척도마다 "점수가 오르는 것"이 좋은지 나쁜지가 다르다.
 *   K-ADL / K-IADL / SGDS-K / TUG → 점수 ↑ 는 악화
 *   K-MMSE                        → 점수 ↑ 는 호전
 */
export function isHigherWorse(code: ScaleCode): boolean {
  return code !== "K_MMSE";
}

export type ScoreDelta = {
  diff: number;
  direction: "up" | "down" | "same";
  /** 임상적으로 나아졌는지 */
  trend: "better" | "worse" | "same";
  label: string;
};

export function compareScores(
  code: ScaleCode,
  previous: number,
  current: number
): ScoreDelta {
  const diff = Math.round((current - previous) * 100) / 100;

  if (diff === 0) {
    return { diff: 0, direction: "same", trend: "same", label: "변화 없음" };
  }

  const direction = diff > 0 ? "up" : "down";
  const higherWorse = isHigherWorse(code);
  const worse = higherWorse ? diff > 0 : diff < 0;
  const magnitude = Math.abs(diff);
  const unit = SCALES[code].unit;

  return {
    diff,
    direction,
    trend: worse ? "worse" : "better",
    label: `${direction === "up" ? "▲" : "▼"} ${magnitude}${unit} ${worse ? "악화" : "호전"}`,
  };
}
