import type { Metadata } from "next";
import { Copyright, Printer, Timer } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PRINTABLE_SCALES, SCALES } from "@/lib/scales";
import {
  FormPicker,
  type PatientOption,
} from "@/components/print/form-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "설문지 인쇄" };

export default async function FormsPage(props: PageProps<"/forms">) {
  const search = await props.searchParams;
  const preselected =
    typeof search.patient === "string" ? search.patient : "";

  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("patients")
    .select("id, name, patient_no, room")
    .is("deleted_at", null)
    .eq("status", "active")
    .order("name", { ascending: true })
    .limit(300);

  const patients = (data ?? []) as PatientOption[];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Printer className="size-6 text-muted-foreground" aria-hidden />
          설문지 인쇄
        </h1>
        <p className="text-[0.95rem] text-muted-foreground">
          빈 설문지를 A4 로 출력해 병실에서 어르신과 직접 진행하세요. 끝난 뒤
          평가 화면의 <strong>&ldquo;점수만 입력&rdquo;</strong>에 결과를 넣으면
          점수와 해석이 자동으로 계산됩니다.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormPicker
            codes={PRINTABLE_SCALES}
            patients={patients}
            defaultPatientId={preselected}
          />
        </CardContent>
      </Card>

      {/* ---------- 종이로 못 뽑는 것 ---------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">종이 양식을 제공하지 않는 검사</CardTitle>
          <CardDescription>
            아래 두 가지는 설문지 형태가 아니라 인쇄 대상이 아닙니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-lg bg-warn-soft px-4 py-3.5 text-sm leading-relaxed">
            <Copyright className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                {SCALES.K_MMSE.name} ({SCALES.K_MMSE.nameEn})
              </p>
              <p>
                저작권이 있는 검사도구라 문항을 인쇄할 수 없습니다. 병원에서
                보유한 정식 용지로 검사한 뒤, 평가 화면에서 영역별 점수만
                입력하세요.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-muted px-4 py-3.5 text-sm leading-relaxed">
            <Timer className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                {SCALES.TUG.name} ({SCALES.TUG.nameEn})
              </p>
              <p>{SCALES.TUG.scoringNote}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
