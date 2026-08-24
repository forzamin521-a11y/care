import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SCALES, isScaleCode } from "@/lib/scales";
import { describePatient } from "@/lib/rrn";
import { ScaleEntry } from "@/components/scale/scale-entry";

export async function generateMetadata(
  props: PageProps<"/assessments/[id]/scales/[code]">
): Promise<Metadata> {
  const { code } = await props.params;
  return {
    title: isScaleCode(code) ? SCALES[code].name : "평가척도",
  };
}

export default async function ScaleEntryPage(
  props: PageProps<"/assessments/[id]/scales/[code]">
) {
  const { id, code } = await props.params;

  if (!isScaleCode(code)) notFound();

  const def = SCALES[code];
  const supabase = await createSupabaseServerClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, seq, patient_id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!assessment) notFound();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, patient_no, sex, birth_date")
    .eq("id", assessment.patient_id)
    .maybeSingle();

  if (!patient) notFound();

  const { data: previous } = await supabase
    .from("scale_results")
    .select("total_score, interpretation, measured_at")
    .eq("patient_id", patient.id)
    .eq("scale_code", code)
    .is("deleted_at", null)
    .order("measured_at", { ascending: false })
    .limit(1);

  const last = previous?.[0] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="no-print flex flex-col gap-2">
        <Link
          href={`/assessments/${assessment.id}/edit`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {assessment.seq}차 평가로 돌아가기
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">
          {def.name}
          <span className="ml-2 text-lg font-normal text-muted-foreground">
            {def.nameEn}
          </span>
        </h1>

        <p className="text-[0.95rem] text-muted-foreground">{def.purpose}</p>

        <p className="text-sm text-muted-foreground">
          {patient.name} · {describePatient(patient.sex, patient.birth_date)} ·{" "}
          <span className="font-mono">{patient.patient_no}</span>
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3.5 text-sm leading-relaxed">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex flex-col gap-1.5">
          <p>{def.scoringNote}</p>
          {last ? (
            <p className="text-muted-foreground">
              지난 결과: <strong>{last.total_score}</strong>
              {last.interpretation ? ` · ${last.interpretation}` : ""} (
              {new Date(last.measured_at).toISOString().slice(0, 10)})
            </p>
          ) : null}
        </div>
      </div>

      <ScaleEntry
        def={def}
        assessmentId={assessment.id}
        patientName={patient.name}
      />

      <p className="text-xs leading-relaxed text-muted-foreground">
        여기 표시되는 해석은 선별 참고용이며 진단이 아닙니다. 출처: {def.source}
      </p>
    </div>
  );
}
