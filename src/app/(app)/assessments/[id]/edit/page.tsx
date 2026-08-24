import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAssessmentData } from "@/lib/schemas/assessment";
import { loadScaleSummaries } from "@/lib/scale-results";
import { AssessmentForm } from "@/components/assessment/assessment-form";

export const metadata: Metadata = { title: "평가 작성" };

export default async function EditAssessmentPage(
  props: PageProps<"/assessments/[id]/edit">
) {
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select(
      "id, seq, kind, status, assessed_at, assessor_name, data, patient_id"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!assessment) notFound();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, patient_no, sex, birth_date, room")
    .eq("id", assessment.patient_id)
    .maybeSingle();

  if (!patient) notFound();

  const scales = await loadScaleSummaries(assessment.id);

  return (
    <AssessmentForm
      assessment={{
        id: assessment.id,
        seq: assessment.seq,
        kind: assessment.kind,
        status: assessment.status,
        assessed_at: assessment.assessed_at,
        assessor_name: assessment.assessor_name,
      }}
      patient={patient}
      initialData={parseAssessmentData(assessment.data)}
      scales={scales}
    />
  );
}
