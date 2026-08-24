"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getCurrentProfile,
} from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import {
  assessmentDataSchema,
  parseAssessmentData,
  type AssessmentData,
} from "@/lib/schemas/assessment";

/**
 * 새 평가를 시작한다.
 * 그 환자의 첫 평가이면 자동으로 '최초평가'가 된다.
 * copyFromId 를 주면 그 회차의 내용을 복사해 온다 (이전 회차 불러오기).
 */
export async function startAssessmentAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  const requestedKind = String(formData.get("kind") ?? "periodic");
  const copyFromId = String(formData.get("copyFrom") ?? "");
  const assessorName = String(formData.get("assessorName") ?? "").trim();

  if (!patientId) redirect("/patients");

  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const supabase = await createSupabaseServerClient();

  // 다음 회차 번호
  const { data: existing } = await supabase
    .from("assessments")
    .select("seq")
    .eq("patient_id", patientId)
    .order("seq", { ascending: false })
    .limit(1);

  const nextSeq = (existing?.[0]?.seq ?? 0) + 1;
  const kind = nextSeq === 1 ? "initial" : requestedKind;

  // 이전 회차 불러오기
  let data: AssessmentData = parseAssessmentData({});

  if (copyFromId) {
    const { data: source } = await supabase
      .from("assessments")
      .select("data")
      .eq("id", copyFromId)
      .eq("patient_id", patientId)
      .maybeSingle();

    if (source) {
      data = parseAssessmentData(source.data);
      // 날짜성 항목은 비워서 새로 적게 한다
      data.footer.writtenOn = "";
      data.j.items = {};
    }
  }

  const { data: created, error } = await supabase
    .from("assessments")
    .insert({
      patient_id: patientId,
      seq: nextSeq,
      kind,
      status: "draft",
      assessor_id: current.user.id,
      assessor_name:
        assessorName ||
        current.profile?.name ||
        (current.user.user_metadata?.name as string | undefined) ||
        null,
      data,
      height_cm: data.d.heightCm,
      weight_kg: data.d.weightKg,
      sbp: data.d.sbp,
      dbp: data.d.dbp,
      pulse: data.d.pulse,
    })
    .select("id")
    .single();

  if (error || !created) {
    throw new Error(`평가를 시작할 수 없습니다: ${error?.message ?? "알 수 없는 오류"}`);
  }

  await logAudit({
    action: "create",
    targetTable: "assessments",
    targetId: created.id,
    detail: { patientId, seq: nextSeq, kind, copiedFrom: copyFromId || null },
  });

  revalidatePath(`/patients/${patientId}`);
  redirect(`/assessments/${created.id}/edit`);
}

export type SaveDraftResult = {
  ok: boolean;
  savedAt?: string;
  error?: string;
};

/**
 * 자동 저장. 3초 debounce 로 호출된다.
 * 완료된 평가는 이 경로로 수정하지 않는다 (수정하려면 reopen).
 */
export async function saveDraftAction(
  assessmentId: string,
  raw: unknown
): Promise<SaveDraftResult> {
  const parsed = assessmentDataSchema.safeParse(raw);

  if (!parsed.success) {
    return { ok: false, error: "입력값 형식이 올바르지 않습니다." };
  }

  const data = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("assessments")
    .update({
      data,
      height_cm: data.d.heightCm,
      weight_kg: data.d.weightKg,
      sbp: data.d.sbp,
      dbp: data.d.dbp,
      pulse: data.d.pulse,
    })
    .eq("id", assessmentId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, savedAt: new Date().toISOString() };
}

/** F · H · J 를 조회용 표로 펼쳐 넣는다 (파생 데이터, 완료 시 재생성) */
async function materializeSections(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  assessmentId: string,
  patientId: string,
  data: AssessmentData
) {
  // F. 약물
  await supabase.from("medications").delete().eq("assessment_id", assessmentId);
  const meds = data.f.items.filter(
    (item) => item.drugName.trim() || item.note.trim()
  );
  if (meds.length > 0) {
    await supabase.from("medications").insert(
      meds.map((item) => ({
        assessment_id: assessmentId,
        category: item.category,
        drug_name: item.drugName || null,
        note: item.note || null,
      }))
    );
  }

  // H. 문제 목록
  await supabase.from("problems").delete().eq("assessment_id", assessmentId);
  const problems = [
    ...data.h.active
      .filter((c) => c.trim())
      .map((content, index) => ({ kind: "active", ord: index + 1, content })),
    ...data.h.inactive
      .filter((c) => c.trim())
      .map((content, index) => ({ kind: "inactive", ord: index + 1, content })),
  ];
  if (problems.length > 0) {
    await supabase.from("problems").insert(
      problems.map((p) => ({
        assessment_id: assessmentId,
        patient_id: patientId,
        kind: p.kind,
        ord: p.ord,
        content: p.content,
      }))
    );
  }

  // I. 관리 계획
  await supabase
    .from("management_plans")
    .delete()
    .eq("assessment_id", assessmentId);
  const plans = data.i.rows.filter((row) => row.content.trim());
  if (plans.length > 0) {
    await supabase.from("management_plans").insert(
      plans.map((row) => ({
        assessment_id: assessmentId,
        patient_id: patientId,
        plan_date: row.planDate || new Date().toISOString().slice(0, 10),
        content: row.content,
        done: row.done === true,
        undone_reason: row.done === false ? row.undoneReason || null : null,
      }))
    );
  }

  // J. 검사
  await supabase.from("labs").delete().eq("assessment_id", assessmentId);
  const labs = Object.entries(data.j.items).filter(
    ([, v]) => v.value.trim() || v.takenOn.trim()
  );
  if (labs.length > 0) {
    await supabase.from("labs").insert(
      labs.map(([code, v]) => ({
        assessment_id: assessmentId,
        code,
        value: v.value || null,
        taken_on: v.takenOn || null,
        abnormal: v.abnormal,
      }))
    );
  }
}

/**
 * 평가 완료 처리.
 * 그 시점의 전체 내용을 assessment_revisions 에 스냅샷으로 남긴다.
 */
export async function completeAssessmentAction(formData: FormData) {
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const assessorName = String(formData.get("assessorName") ?? "").trim();
  const changeNote = String(formData.get("changeNote") ?? "").trim();

  if (!assessmentId) redirect("/patients");

  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, patient_id, data, version, status")
    .eq("id", assessmentId)
    .maybeSingle();

  if (!assessment) redirect("/patients");

  const data = parseAssessmentData(assessment.data);

  // 이미 완료된 것을 다시 완료하면 버전을 올린다 (수정 이력)
  const nextVersion =
    assessment.status === "completed"
      ? (assessment.version ?? 1) + 1
      : (assessment.version ?? 1);

  const { error } = await supabase
    .from("assessments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      version: nextVersion,
      assessor_name:
        assessorName ||
        current.profile?.name ||
        (current.user.user_metadata?.name as string | undefined) ||
        null,
    })
    .eq("id", assessmentId);

  if (error) {
    throw new Error(`완료 처리에 실패했습니다: ${error.message}`);
  }

  // 버전 스냅샷
  await supabase.from("assessment_revisions").upsert(
    {
      assessment_id: assessmentId,
      version: nextVersion,
      data,
      changed_by: current.user.id,
      changed_by_name: current.profile?.name ?? null,
      change_note: changeNote || null,
    },
    { onConflict: "assessment_id,version" }
  );

  await materializeSections(
    supabase,
    assessmentId,
    assessment.patient_id,
    data
  );

  // 최초평가의 입소이유는 환자 정보에도 반영해 둔다
  if (data.a.admitReason) {
    await supabase
      .from("patients")
      .update({ admit_reason: data.a.admitReason })
      .eq("id", assessment.patient_id)
      .is("admit_reason", null);
  }

  await logAudit({
    action: "update",
    targetTable: "assessments",
    targetId: assessmentId,
    detail: { status: "completed", version: nextVersion },
  });

  revalidatePath(`/patients/${assessment.patient_id}`);
  revalidatePath(`/assessments/${assessmentId}`);
  redirect(`/assessments/${assessmentId}`);
}

/**
 * 작성 중(draft) 평가 삭제.
 *
 * 잘못 눌러 만든 빈 평가를 치우기 위한 기능이다.
 * 완료된 평가는 진료기록이므로 여기서 지우지 않는다 —
 * 고칠 내용이 있으면 수정해서 새 버전으로 남긴다.
 * 삭제도 실제로 지우지 않고 deleted_at 만 채운다.
 */
export async function deleteDraftAssessmentAction(formData: FormData) {
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) redirect("/patients");

  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, patient_id, seq, status")
    .eq("id", assessmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!assessment) redirect("/patients");

  if (assessment.status !== "draft") {
    throw new Error(
      "완료된 평가는 삭제할 수 없습니다. 내용을 고치려면 수정을 눌러 새 버전으로 남기세요."
    );
  }

  const { error } = await supabase
    .from("assessments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", assessmentId)
    .eq("status", "draft");

  if (error) {
    throw new Error(`삭제하지 못했습니다: ${error.message}`);
  }

  await logAudit({
    action: "delete",
    targetTable: "assessments",
    targetId: assessmentId,
    detail: { seq: assessment.seq, status: "draft" },
  });

  revalidatePath(`/patients/${assessment.patient_id}`);
  redirect(`/patients/${assessment.patient_id}?assessment_deleted=1`);
}

/** 완료된 평가를 다시 수정 가능한 상태로 되돌린다 */
export async function reopenAssessmentAction(formData: FormData) {
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) redirect("/patients");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("assessments")
    .update({ status: "draft" })
    .eq("id", assessmentId);

  if (error) {
    throw new Error(`수정 상태로 되돌리지 못했습니다: ${error.message}`);
  }

  await logAudit({
    action: "update",
    targetTable: "assessments",
    targetId: assessmentId,
    detail: { status: "draft" },
  });

  redirect(`/assessments/${assessmentId}/edit`);
}
