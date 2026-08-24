import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Printer, History } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadScaleSummaries } from "@/lib/scale-results";
import { parseAssessmentData } from "@/lib/schemas/assessment";
import { formatDate } from "@/lib/due";
import { AssessmentDocument } from "@/components/assessment/assessment-document";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "평가 상세" };

type Revision = {
  version: number;
  changed_at: string;
  changed_by_name: string | null;
  change_note: string | null;
};

export default async function AssessmentDetailPage(
  props: PageProps<"/assessments/[id]">
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

  const { data: revisionRows } = await supabase
    .from("assessment_revisions")
    .select("version, changed_at, changed_by_name, change_note")
    .eq("assessment_id", assessment.id)
    .order("version", { ascending: false });

  const revisions = (revisionRows ?? []) as Revision[];

  return (
    <div className="flex flex-col gap-5">
      {/* ---------- 도구막대 ---------- */}
      <div className="no-print flex flex-wrap items-center gap-3">
        <Link
          href={`/patients/${patient.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {patient.name}
        </Link>

        <Badge
          variant="secondary"
          className={
            assessment.status === "completed"
              ? "bg-ok-soft font-normal text-foreground"
              : "bg-warn-soft font-normal text-foreground"
          }
        >
          {assessment.status === "completed" ? "완료" : "작성 중"}
        </Badge>

        {assessment.version > 1 ? (
          <Badge variant="outline" className="font-normal">
            v{assessment.version}
          </Badge>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline" className="h-11 gap-1.5 px-4">
            <Link href={`/assessments/${assessment.id}/edit`}>
              <Pencil className="size-4" aria-hidden />
              수정
            </Link>
          </Button>
          <Button asChild className="h-11 gap-1.5 px-4">
            <Link href={`/assessments/${assessment.id}/print`}>
              <Printer className="size-4" aria-hidden />
              A4 인쇄
            </Link>
          </Button>
        </div>
      </div>

      {/* ---------- 본문 ---------- */}
      <div className="rounded-xl border bg-card px-6 py-6 sm:px-8 sm:py-8">
        <AssessmentDocument
          patient={patient}
          assessment={assessment}
          data={parseAssessmentData(assessment.data)}
          scales={scales}
        />
      </div>

      {/* ---------- 버전 이력 ---------- */}
      {revisions.length > 0 ? (
        <section className="no-print rounded-xl border bg-card px-5 py-5">
          <h2 className="flex items-center gap-2 text-[1.05rem] font-semibold">
            <History className="size-4 text-muted-foreground" aria-hidden />
            수정 이력
          </h2>
          <ol className="mt-3 flex flex-col divide-y">
            {revisions.map((rev) => (
              <li
                key={rev.version}
                className="flex flex-wrap items-center gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
              >
                <span className="w-10 font-mono text-muted-foreground">
                  v{rev.version}
                </span>
                <span>{formatDate(rev.changed_at)}</span>
                <span className="text-muted-foreground">
                  {rev.changed_by_name ?? "-"}
                </span>
                {rev.change_note ? (
                  <span className="text-muted-foreground">
                    · {rev.change_note}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
