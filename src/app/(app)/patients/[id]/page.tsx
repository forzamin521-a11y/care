import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FilePlus2,
  ClipboardList,
  GitCompareArrows,
  TrendingUp,
  Printer,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadPatientTrends, loadScaleSummaries } from "@/lib/scale-results";
import { describePatient, maskRrn } from "@/lib/rrn";
import { assessmentDue, formatDate } from "@/lib/due";
import { ASSESSMENT_KINDS } from "@/lib/constants";
import {
  SCALES,
  SCALE_ORDER,
  type ScaleCode,
  type ScaleSummary,
} from "@/lib/scales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendCharts } from "@/components/chart/trend-charts";
import { DeletePatientButton } from "../delete-patient";

export const metadata: Metadata = { title: "환자 정보" };

type Assessment = {
  id: string;
  seq: number;
  kind: string;
  status: string;
  assessed_at: string;
  assessor_name: string | null;
};

function kindLabel(kind: string) {
  return ASSESSMENT_KINDS.find((k) => k.key === kind)?.label ?? kind;
}

const SEVERITY_STYLE = {
  ok: "bg-ok-soft",
  warn: "bg-warn-soft",
  danger: "bg-danger-soft",
} as const;

export default async function PatientDetailPage(
  props: PageProps<"/patients/[id]">
) {
  const { id } = await props.params;
  const supabase = await createSupabaseServerClient();

  const { data: patient } = await supabase
    .from("patients")
    .select(
      "id, patient_no, name, sex, birth_date, rrn_front, rrn_sex_digit, room, phone, address, admitted_on, status, note"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!patient) notFound();

  const { data: assessmentRows } = await supabase
    .from("assessments")
    .select("id, seq, kind, status, assessed_at, assessor_name")
    .eq("patient_id", id)
    .is("deleted_at", null)
    .order("seq", { ascending: false });

  const assessments = (assessmentRows ?? []) as Assessment[];
  const latestCompleted = assessments.find((a) => a.status === "completed");
  const due = assessmentDue(latestCompleted?.assessed_at ?? null);

  const latestScales: Partial<Record<ScaleCode, ScaleSummary>> =
    latestCompleted ? await loadScaleSummaries(latestCompleted.id) : {};
  const trends = await loadPatientTrends(id);

  const details: { label: string; value: string }[] = [
    { label: "등록번호", value: patient.patient_no },
    {
      label: "성별 / 나이",
      value: describePatient(patient.sex, patient.birth_date),
    },
    {
      label: "주민등록번호",
      value: maskRrn(patient.rrn_front, patient.rrn_sex_digit),
    },
    { label: "병동 / 호실", value: patient.room ?? "-" },
    { label: "입소일", value: formatDate(patient.admitted_on) },
    { label: "보호자 연락처", value: patient.phone ?? "-" },
    { label: "주소", value: patient.address ?? "-" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- 머리말 ---------- */}
      <div className="flex flex-col gap-2">
        <Link
          href="/patients"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          환자 목록
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient.name}
            </h1>
            <span className="text-base text-muted-foreground">
              {describePatient(patient.sex, patient.birth_date)}
            </span>
            <span className="font-mono text-sm text-muted-foreground">
              {patient.patient_no}
            </span>
            {due.status === "overdue" ? (
              <Badge
                variant="secondary"
                className="bg-danger-soft font-normal text-foreground"
              >
                정기평가 {due.label}
              </Badge>
            ) : due.status === "soon" ? (
              <Badge
                variant="secondary"
                className="bg-warn-soft font-normal text-foreground"
              >
                정기평가 {due.label}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="h-11 gap-1.5 px-4">
              <Link href={`/forms?patient=${patient.id}`}>
                <Printer className="size-4" aria-hidden />
                설문지 인쇄
              </Link>
            </Button>
            {assessments.length >= 2 ? (
              <Button asChild variant="outline" className="h-11 gap-1.5 px-4">
                <Link href={`/patients/${patient.id}/compare`}>
                  <GitCompareArrows className="size-4" aria-hidden />
                  회차 비교
                </Link>
              </Button>
            ) : null}
            <Button asChild className="h-11 gap-1.5 px-4 text-[0.95rem]">
              <Link href={`/patients/${patient.id}/assessments/new`}>
                <FilePlus2 className="size-4" aria-hidden />
                새 평가 작성
              </Link>
            </Button>
            <DeletePatientButton
              patientId={patient.id}
              patientName={patient.name}
              assessmentCount={assessments.length}
              variant="icon"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* ---------- 왼쪽: 기본 정보 ---------- */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col divide-y">
                {details.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-start justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                  >
                    <dt className="shrink-0 text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="text-right break-keep">{row.value}</dd>
                  </div>
                ))}
              </dl>

              {patient.note ? (
                <p className="mt-4 rounded-md bg-muted px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                  {patient.note}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* 최근 척도 결과 */}
          {latestCompleted ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  최근 평가 결과
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {latestCompleted.seq}차 ·{" "}
                    {formatDate(latestCompleted.assessed_at)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {SCALE_ORDER.map((code) => {
                  const summary = latestScales[code];
                  const def = SCALES[code];

                  return (
                    <div
                      key={code}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">{def.name}</span>
                      {summary ? (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 font-mono text-[0.8rem]",
                            SEVERITY_STYLE[summary.severity]
                          )}
                          title={summary.interpretation}
                        >
                          {summary.display}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">미실시</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* ---------- 오른쪽: 추이 + 이력 ---------- */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
                변화 추이
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendCharts scales={trends.scales} vitals={trends.vitals} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">평가 이력</CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-muted">
                    <ClipboardList
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">아직 평가 기록이 없습니다.</p>
                    <p className="text-sm text-muted-foreground">
                      첫 평가는 최초평가로 작성됩니다.
                    </p>
                  </div>
                  <Button asChild className="h-11 gap-1.5 px-4">
                    <Link href={`/patients/${patient.id}/assessments/new`}>
                      <FilePlus2 className="size-4" aria-hidden />
                      최초평가 작성
                    </Link>
                  </Button>
                </div>
              ) : (
                <ol className="flex flex-col divide-y">
                  {assessments.map((assessment) => (
                    <li
                      key={assessment.id}
                      className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <span className="w-10 shrink-0 font-mono text-sm text-muted-foreground">
                        {assessment.seq}차
                      </span>
                      <Link
                        href={
                          assessment.status === "completed"
                            ? `/assessments/${assessment.id}`
                            : `/assessments/${assessment.id}/edit`
                        }
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {formatDate(assessment.assessed_at)}
                      </Link>
                      <Badge variant="outline" className="font-normal">
                        {kindLabel(assessment.kind)}
                      </Badge>
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
                      {assessment.assessor_name ? (
                        <span className="ml-auto text-sm text-muted-foreground">
                          {assessment.assessor_name}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
