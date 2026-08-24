import { PERIODIC_INTERVAL_MONTHS } from "./constants";

export type DueStatus = "none" | "ok" | "soon" | "overdue";

export type DueInfo = {
  status: DueStatus;
  /** 다음 평가 예정일 (YYYY-MM-DD) */
  dueDate: string | null;
  /** 남은 일수. 음수면 지났다 */
  daysLeft: number | null;
  label: string;
};

const DAY = 24 * 60 * 60 * 1000;

/** 예정일 30일 전부터 "곧 예정"으로 알린다 */
const SOON_WINDOW_DAYS = 30;

function toDateOnly(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 마지막 평가일을 기준으로 다음 정기평가 예정일과 상태를 계산한다.
 * 기본 주기는 6개월 (constants.PERIODIC_INTERVAL_MONTHS).
 */
export function assessmentDue(
  lastAssessedAt: string | null | undefined,
  now: Date = new Date()
): DueInfo {
  if (!lastAssessedAt) {
    return {
      status: "none",
      dueDate: null,
      daysLeft: null,
      label: "평가 없음",
    };
  }

  const last = new Date(lastAssessedAt);
  if (Number.isNaN(last.getTime())) {
    return { status: "none", dueDate: null, daysLeft: null, label: "평가 없음" };
  }

  const due = new Date(last);
  due.setMonth(due.getMonth() + PERIODIC_INTERVAL_MONTHS);

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfDue = new Date(
    due.getFullYear(),
    due.getMonth(),
    due.getDate()
  );

  const daysLeft = Math.round(
    (startOfDue.getTime() - startOfToday.getTime()) / DAY
  );

  if (daysLeft < 0) {
    return {
      status: "overdue",
      dueDate: toDateOnly(due),
      daysLeft,
      label: `${Math.abs(daysLeft)}일 지남`,
    };
  }

  if (daysLeft <= SOON_WINDOW_DAYS) {
    return {
      status: "soon",
      dueDate: toDateOnly(due),
      daysLeft,
      label: daysLeft === 0 ? "오늘 예정" : `${daysLeft}일 남음`,
    };
  }

  return {
    status: "ok",
    dueDate: toDateOnly(due),
    daysLeft,
    label: `${toDateOnly(due)} 예정`,
  };
}

/** 화면 표기용 — 2026-08-20 형태로 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return toDateOnly(date);
}
