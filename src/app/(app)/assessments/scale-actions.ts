"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getCurrentProfile,
} from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  SCALES,
  isScaleCode,
  scoreDomainScale,
  scoreFromTotal,
  scoreItemScale,
  scoreNumericScale,
  type EntryMode,
  type ScoreOutcome,
} from "@/lib/scales";

export type SaveScaleState = {
  ok?: boolean;
  error?: string;
};

/**
 * 척도 결과 저장.
 *
 * 채점은 반드시 서버에서 다시 한다 — 화면에서 계산한 값을 그대로 믿지 않는다.
 * 같은 평가 회차의 같은 척도는 최신 1건만 남긴다.
 */
export async function saveScaleResultAction(
  _prev: SaveScaleState,
  formData: FormData
): Promise<SaveScaleState> {
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const code = String(formData.get("code") ?? "");
  const entryMode = String(formData.get("entryMode") ?? "") as EntryMode;
  const note = String(formData.get("note") ?? "").trim();

  if (!assessmentId || !isScaleCode(code)) {
    return { error: "잘못된 요청입니다." };
  }

  if (!["web", "score_only", "paper"].includes(entryMode)) {
    return { error: "입력 방식이 올바르지 않습니다." };
  }

  const def = SCALES[code];
  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, patient_id")
    .eq("id", assessmentId)
    .maybeSingle();

  if (!assessment) return { error: "평가를 찾을 수 없습니다." };

  // ---------- 채점 ----------
  let outcome: ScoreOutcome;
  let answers: Record<number, number> | null = null;
  let subscores: Record<string, number> | null = null;

  if (entryMode === "web" && def.kind === "items") {
    const raw = String(formData.get("answers") ?? "{}");
    let parsed: Record<string, number>;

    try {
      parsed = JSON.parse(raw) as Record<string, number>;
    } catch {
      return { error: "응답을 읽을 수 없습니다." };
    }

    answers = {};
    for (const [key, value] of Object.entries(parsed)) {
      const no = Number(key);
      if (Number.isInteger(no) && typeof value === "number") {
        answers[no] = value;
      }
    }

    outcome = scoreItemScale(def, answers);

    if (outcome.unanswered && outcome.unanswered > 0) {
      return {
        error: `아직 답하지 않은 문항이 ${outcome.unanswered}개 있습니다.`,
      };
    }
  } else if (def.kind === "domains") {
    subscores = {};
    for (const domain of def.domains) {
      const raw = formData.get(`domain-${domain.key}`);
      const value = raw === null || raw === "" ? 0 : Number(raw);
      subscores[domain.key] = Number.isFinite(value) ? value : 0;
    }
    outcome = scoreDomainScale(def, subscores);
  } else if (def.kind === "numeric") {
    const raw = formData.get("total");
    const value = raw === null || raw === "" ? NaN : Number(raw);

    if (!Number.isFinite(value)) {
      return { error: "측정값을 입력하세요." };
    }
    outcome = scoreNumericScale(def, value);
  } else {
    // 문항형인데 점수만 입력하는 경우
    const raw = formData.get("total");
    const value = raw === null || raw === "" ? NaN : Number(raw);

    if (!Number.isFinite(value)) {
      return { error: "점수를 입력하세요." };
    }

    if (value < def.scoreRange.min || value > def.scoreRange.max) {
      return {
        error: `점수는 ${def.scoreRange.min} ~ ${def.scoreRange.max} 사이여야 합니다.`,
      };
    }
    outcome = scoreFromTotal(def, value);
  }

  // ---------- 저장 (같은 회차·같은 척도는 최신 1건만) ----------
  await supabase
    .from("scale_results")
    .delete()
    .eq("assessment_id", assessmentId)
    .eq("scale_code", code);

  const { error } = await supabase.from("scale_results").insert({
    patient_id: assessment.patient_id,
    assessment_id: assessmentId,
    scale_code: code,
    entry_mode: entryMode,
    answers,
    subscores,
    total_score: outcome.total,
    interpretation: outcome.interpretation,
    severity: outcome.severity,
    note: note || null,
    created_by: current.user.id,
    created_by_name: current.profile?.name ?? null,
  });

  if (error) {
    return { error: `저장에 실패했습니다: ${error.message}` };
  }

  await logAudit({
    action: "create",
    targetTable: "scale_results",
    targetId: assessmentId,
    detail: { code, entryMode, total: outcome.total },
  });

  revalidatePath(`/assessments/${assessmentId}/edit`);
  revalidatePath(`/assessments/${assessmentId}`);
  redirect(`/assessments/${assessmentId}/edit#section-${def.code === "SGDS_K" || def.code === "K_MMSE" ? "e" : "d"}`);
}
