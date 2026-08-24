import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadScaleSummaries } from "@/lib/scale-results";
import { parseAssessmentData } from "@/lib/schemas/assessment";
import { AssessmentDocument } from "@/components/assessment/assessment-document";
import { PrintToolbar } from "@/components/print/print-toolbar";

export const metadata: Metadata = { title: "포괄평가기록부 인쇄" };

export default async function PrintAssessmentPage(
  props: PageProps<"/assessments/[id]/print">
) {
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select(
      "id, seq, kind, status, assessed_at, assessor_name, version, data, patient_id"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!assessment) notFound();

  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, name, patient_no, sex, birth_date, rrn_front, rrn_sex_digit, address, room"
    )
    .eq("id", assessment.patient_id)
    .maybeSingle();

  if (!patient) notFound();

  const scales = await loadScaleSummaries(assessment.id);

  return (
    <div className="mx-auto w-full max-w-[190mm] print:max-w-none">
      <PrintToolbar
        title={`${patient.name} · ${assessment.seq}차 포괄평가기록부`}
        hint="A4 2장으로 출력됩니다. 인쇄 창에서 배율은 100%, 여백은 기본값으로 두세요."
      />

      <AssessmentDocument
        patient={patient}
        assessment={assessment}
        data={parseAssessmentData(assessment.data)}
        scales={scales}
      />
    </div>
  );
}
