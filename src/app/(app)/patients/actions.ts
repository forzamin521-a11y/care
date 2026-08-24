"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import { patientFormSchema } from "@/lib/schemas/patient";
import { logAudit } from "@/lib/audit";

export type PatientFormState = {
  /** 필드별 오류 — 입력칸 아래에 표시 */
  fieldErrors?: Record<string, string>;
  /** 폼 전체 오류 */
  error?: string;
  /** 다시 그릴 때 값을 유지하기 위한 원본 */
  values?: Record<string, string>;
};

function formToRecord(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/**
 * 환자 삭제 — 실제로 지우지 않고 deleted_at 만 채운다.
 *
 * 진료기록은 법정 보존기간(항목별 5~10년)이 있으므로 하드 삭제를 하지 않는다.
 * 목록에서 사라질 뿐 데이터베이스에는 남아 있고, 언제든 되돌릴 수 있다.
 */
export async function softDeletePatientAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) redirect("/patients");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, patient_no")
    .eq("id", patientId)
    .maybeSingle();

  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", patientId);

  if (error) {
    throw new Error(`삭제하지 못했습니다: ${error.message}`);
  }

  await logAudit({
    action: "delete",
    targetTable: "patients",
    targetId: patientId,
    detail: { name: patient?.name, patient_no: patient?.patient_no },
  });

  revalidatePath("/patients");
  redirect("/patients?deleted=1");
}

/** 삭제한 환자를 되돌린다 */
export async function restorePatientAction(formData: FormData) {
  const patientId = String(formData.get("patientId") ?? "");
  if (!patientId) redirect("/patients");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("patients")
    .update({ deleted_at: null })
    .eq("id", patientId);

  if (error) {
    // 같은 등록번호를 쓰는 환자가 이미 있으면 되돌릴 수 없다
    if (error.code === "23505") {
      throw new Error(
        "같은 등록번호를 쓰는 환자가 이미 있어 되돌릴 수 없습니다. 등록번호를 정리한 뒤 다시 시도하세요."
      );
    }
    throw new Error(`되돌리지 못했습니다: ${error.message}`);
  }

  await logAudit({
    action: "update",
    targetTable: "patients",
    targetId: patientId,
    detail: { restored: true },
  });

  revalidatePath("/patients");
  redirect(`/patients/${patientId}`);
}

export async function createPatientAction(
  _prev: PatientFormState,
  formData: FormData
): Promise<PatientFormState> {
  const values = formToRecord(formData);
  const parsed = patientFormSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "_");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, values };
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("patients")
    .insert({ ...parsed.data, created_by: user.id })
    .select("id, name, patient_no")
    .single();

  if (error) {
    // 등록번호 중복 (부분 유니크 인덱스)
    if (error.code === "23505" || error.message.includes("patients_patient_no_uniq")) {
      return {
        fieldErrors: { patient_no: "이미 사용 중인 등록번호입니다." },
        values,
      };
    }
    return { error: `저장에 실패했습니다: ${error.message}`, values };
  }

  await logAudit({
    action: "create",
    targetTable: "patients",
    targetId: data.id,
    detail: { name: data.name, patient_no: data.patient_no },
  });

  revalidatePath("/patients");
  redirect(`/patients/${data.id}`);
}
