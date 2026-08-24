import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FilePlus2, CopyPlus } from "lucide-react";
import {
  createSupabaseServerClient,
  getCurrentProfile,
} from "@/lib/supabase/server";
import { startAssessmentAction } from "@/app/(app)/assessments/actions";
import { describePatient } from "@/lib/rrn";
import { formatDate } from "@/lib/due";
import { ASSESSMENT_KINDS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "새 평가" };

export default async function NewAssessmentPage(
  props: PageProps<"/patients/[id]/assessments/new">
) {
  const { id } = await props.params;

  const current = await getCurrentProfile();
  if (!current) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, patient_no, sex, birth_date, room")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!patient) notFound();

  const { data: previousRows } = await supabase
    .from("assessments")
    .select("id, seq, kind, status, assessed_at")
    .eq("patient_id", id)
    .is("deleted_at", null)
    .order("seq", { ascending: false })
    .limit(5);

  const previous = previousRows ?? [];
  const isFirst = previous.length === 0;
  const latest = previous[0] ?? null;

  const defaultName =
    current.profile?.name ??
    (current.user.user_metadata?.name as string | undefined) ??
    "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/patients/${patient.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {patient.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">새 평가 작성</h1>
        <p className="text-sm text-muted-foreground">
          {patient.name} · {describePatient(patient.sex, patient.birth_date)} ·{" "}
          <span className="font-mono">{patient.patient_no}</span>
          {patient.room ? ` · ${patient.room}` : ""}
        </p>
      </div>

      <form action={startAssessmentAction} className="flex flex-col gap-6">
        <input type="hidden" name="patientId" value={patient.id} />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">평가 종류</CardTitle>
            {isFirst ? (
              <CardDescription>
                이 환자의 첫 평가이므로 <strong>최초평가</strong>로 작성됩니다.
              </CardDescription>
            ) : (
              <CardDescription>
                지금까지 {previous.length}회 작성했습니다. 다음은{" "}
                {previous[0].seq + 1}차입니다.
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            {isFirst ? (
              <input type="hidden" name="kind" value="initial" />
            ) : (
              <div className="flex flex-col gap-2.5">
                {ASSESSMENT_KINDS.filter((k) => k.key !== "initial").map(
                  (kind, index) => (
                    <label
                      key={kind.key}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent"
                    >
                      <input
                        type="radio"
                        name="kind"
                        value={kind.key}
                        defaultChecked={index === 0}
                        className="mt-1 size-4 accent-[var(--primary)]"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span className="font-medium">{kind.label}</span>
                        <span className="text-sm text-muted-foreground">
                          {kind.help}
                        </span>
                      </span>
                    </label>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {latest ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CopyPlus className="size-4 text-muted-foreground" aria-hidden />
                이전 회차 불러오기
              </CardTitle>
              <CardDescription>
                지난 평가 내용을 그대로 채워넣고 바뀐 부분만 고치면 됩니다.
                검사 결과와 작성일자는 비워집니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent">
                <input
                  type="checkbox"
                  name="copyFrom"
                  value={latest.id}
                  defaultChecked
                  className="mt-1 size-4 accent-[var(--primary)]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {latest.seq}차 ({formatDate(latest.assessed_at)}) 내용
                    불러오기
                  </span>
                  <span className="text-sm text-muted-foreground">
                    체크를 풀면 빈 서식으로 시작합니다.
                  </span>
                </span>
              </label>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">작성자</CardTitle>
            <CardDescription>
              계정을 함께 쓰므로 누가 작성했는지 이름을 남깁니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Label htmlFor="assessorName" className="text-[0.95rem]">
                이름
              </Label>
              <Input
                id="assessorName"
                name="assessorName"
                defaultValue={defaultName}
                required
                className="h-11 max-w-[16rem] text-base"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" size="lg" className="h-12 gap-2 px-6 text-base">
            <FilePlus2 className="size-5" aria-hidden />
            평가 시작
          </Button>
          <Button asChild variant="ghost" className="h-12 px-4 text-base">
            <Link href={`/patients/${patient.id}`}>취소</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
