import "server-only";

import { createSupabaseServerClient } from "./supabase/server";
import { SCALES, isScaleCode, type ScaleCode, type ScaleSummary } from "./scales";

type Row = {
  scale_code: string;
  entry_mode: string;
  total_score: number | null;
  interpretation: string | null;
  severity: string | null;
  measured_at: string;
};

function toSummary(row: Row, display: string): ScaleSummary {
  if (!isScaleCode(row.scale_code)) return null;

  return {
    code: row.scale_code,
    display,
    interpretation: row.interpretation ?? "",
    severity:
      row.severity === "warn" || row.severity === "danger"
        ? row.severity
        : "ok",
    measuredAt: row.measured_at,
    entryMode:
      row.entry_mode === "web" || row.entry_mode === "paper"
        ? row.entry_mode
        : "score_only",
  };
}

/**
 * 한 평가 회차에 붙은 척도 결과를 척도별로 최신 1건씩 가져온다.
 * display 문자열은 저장 시 만들어 둔 값이 없으므로 여기서 조립한다.
 */
export async function loadScaleSummaries(
  assessmentId: string
): Promise<Partial<Record<ScaleCode, ScaleSummary>>> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("scale_results")
    .select(
      "scale_code, entry_mode, total_score, interpretation, severity, measured_at, subscores"
    )
    .eq("assessment_id", assessmentId)
    .is("deleted_at", null)
    .order("measured_at", { ascending: false });

  const out: Partial<Record<ScaleCode, ScaleSummary>> = {};

  for (const row of (data ?? []) as Row[]) {
    if (!isScaleCode(row.scale_code)) continue;
    if (out[row.scale_code]) continue; // 이미 최신 건을 담았다

    const def = SCALES[row.scale_code];
    const total = row.total_score ?? 0;

    const display =
      def.code === "K_IADL"
        ? `${Number(total).toFixed(2)} ${def.unit}`
        : def.kind === "numeric"
          ? `${total}${def.unit}`
          : `${total} / ${def.scoreRange.max}${def.unit}`;

    out[row.scale_code] = toSummary(row, display);
  }

  return out;
}

/**
 * 환자 한 명의 전체 추이 — 척도 점수 + 체중/혈압.
 * 완료된 평가만 대상으로 한다 (작성 중인 초안은 그래프를 흔든다).
 */
export async function loadPatientTrends(patientId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: scaleRows }, { data: vitalRows }] = await Promise.all([
    supabase
      .from("scale_results")
      .select("scale_code, total_score, measured_at")
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .order("measured_at", { ascending: true }),
    supabase
      .from("assessments")
      .select("assessed_at, weight_kg, sbp")
      .eq("patient_id", patientId)
      .eq("status", "completed")
      .is("deleted_at", null)
      .order("assessed_at", { ascending: true }),
  ]);

  const grouped = new Map<ScaleCode, { date: string; value: number }[]>();

  for (const row of scaleRows ?? []) {
    if (!isScaleCode(row.scale_code)) continue;
    if (row.total_score === null) continue;

    const list = grouped.get(row.scale_code) ?? [];
    list.push({
      date: String(row.measured_at).slice(0, 10),
      value: Number(row.total_score),
    });
    grouped.set(row.scale_code, list);
  }

  return {
    scales: Array.from(grouped.entries()).map(([code, points]) => ({
      code,
      points,
    })),
    vitals: {
      points: (vitalRows ?? []).map((row) => ({
        date: String(row.assessed_at).slice(0, 10),
        weight: row.weight_kg === null ? null : Number(row.weight_kg),
        sbp: row.sbp === null ? null : Number(row.sbp),
      })),
    },
  };
}

/** 환자 단위 추이 조회 — 회차 비교·차트에 쓴다 */
export async function loadScaleTrend(
  patientId: string,
  code: ScaleCode,
  limit = 20
) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("scale_results")
    .select("total_score, interpretation, severity, measured_at, assessment_id")
    .eq("patient_id", patientId)
    .eq("scale_code", code)
    .is("deleted_at", null)
    .order("measured_at", { ascending: true })
    .limit(limit);

  return data ?? [];
}
