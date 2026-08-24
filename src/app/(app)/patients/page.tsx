import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, Users, AlertCircle, Trash2, ArrowLeft } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { describePatient, maskRrn } from "@/lib/rrn";
import { assessmentDue, formatDate } from "@/lib/due";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PatientRow } from "./patient-row";
import { DeletePatientButton, RestorePatientButton } from "./delete-patient";

export const metadata: Metadata = { title: "환자 목록" };

type PatientRecord = {
  id: string;
  patient_no: string;
  name: string;
  sex: "M" | "F" | null;
  birth_date: string | null;
  rrn_front: string | null;
  rrn_sex_digit: string | null;
  room: string | null;
  status: string;
  deleted_at: string | null;
  assessments: { assessed_at: string; status: string }[] | null;
};

const DUE_BADGE = {
  overdue: { className: "bg-danger-soft text-foreground", prefix: "지연" },
  soon: { className: "bg-warn-soft text-foreground", prefix: "예정" },
  ok: { className: "bg-ok-soft text-foreground", prefix: "" },
  none: { className: "bg-muted text-muted-foreground", prefix: "" },
} as const;

export default async function PatientsPage(props: PageProps<"/patients">) {
  const params = await props.searchParams;
  const rawQuery = params.q;
  const query = (typeof rawQuery === "string" ? rawQuery : "").trim();
  const passwordChanged = params.password_changed === "1";
  const justDeleted = params.deleted === "1";
  const showDeleted = params.trash === "1";

  const supabase = await createSupabaseServerClient();

  let request = supabase
    .from("patients")
    .select(
      "id, patient_no, name, sex, birth_date, rrn_front, rrn_sex_digit, room, status, deleted_at, assessments(assessed_at, status)"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  request = showDeleted
    ? request.not("deleted_at", "is", null)
    : request.is("deleted_at", null);

  if (query) {
    // 이름 또는 등록번호로 검색
    request = request.or(`name.ilike.%${query}%,patient_no.ilike.%${query}%`);
  }

  const { data, error } = await request;
  const patients = (data ?? []) as PatientRecord[];

  return (
    <div className="flex flex-col gap-6">
      {passwordChanged ? (
        <div className="rounded-lg bg-ok-soft px-4 py-3 text-sm">
          비밀번호가 변경되었습니다.
        </div>
      ) : null}

      {justDeleted ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
          <span>
            환자를 목록에서 삭제했습니다. 기록은 지워지지 않았으며 되돌릴 수
            있습니다.
          </span>
          <Button asChild variant="outline" size="sm" className="ml-auto h-9">
            <Link href="/patients?trash=1">삭제된 환자 보기</Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {showDeleted ? "삭제된 환자" : "환자 목록"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {query
              ? `"${query}" 검색 결과 ${patients.length}명`
              : showDeleted
                ? `삭제된 환자 ${patients.length}명 · 되돌리면 목록으로 돌아옵니다`
                : `등록된 환자 ${patients.length}명`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form
            action="/patients"
            className="flex items-center gap-2"
          >
            {showDeleted ? (
              <input type="hidden" name="trash" value="1" />
            ) : null}
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="q"
                defaultValue={query}
                placeholder="이름 · 등록번호 검색"
                aria-label="환자 검색"
                className="h-11 w-[15rem] pl-9 text-base"
              />
            </div>
            <Button type="submit" variant="outline" className="h-11">
              검색
            </Button>
          </form>

          {showDeleted ? (
            <Button asChild variant="outline" className="h-11 gap-1.5 px-4">
              <Link href="/patients">
                <ArrowLeft className="size-4" aria-hidden />
                목록으로
              </Link>
            </Button>
          ) : (
            <Button asChild className="h-11 gap-1.5 px-4 text-[0.95rem]">
              <Link href="/patients/new">
                <UserPlus className="size-4" aria-hidden />
                환자 등록
              </Link>
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2.5 rounded-lg bg-danger-soft px-4 py-3.5 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="flex flex-col gap-1">
            <p className="font-medium">환자 목록을 불러오지 못했습니다.</p>
            <p className="text-muted-foreground">{error.message}</p>
            <p className="text-muted-foreground">
              Supabase 마이그레이션(supabase/migrations/0001_init.sql)을 실행했는지
              확인하세요.
            </p>
          </div>
        </div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed bg-card px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            {showDeleted ? (
              <Trash2 className="size-6 text-muted-foreground" aria-hidden />
            ) : (
              <Users className="size-6 text-muted-foreground" aria-hidden />
            )}
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              {showDeleted
                ? "삭제된 환자가 없습니다."
                : query
                  ? "검색 결과가 없습니다."
                  : "아직 등록된 환자가 없습니다."}
            </p>
            <p className="text-sm text-muted-foreground">
              {showDeleted
                ? ""
                : query
                  ? "다른 이름이나 등록번호로 찾아보세요."
                  : "환자를 등록하면 포괄평가를 작성할 수 있습니다."}
            </p>
          </div>
          {showDeleted ? (
            <Button asChild variant="outline" className="h-11">
              <Link href="/patients">환자 목록으로</Link>
            </Button>
          ) : query ? (
            <Button asChild variant="outline" className="h-11">
              <Link href="/patients">전체 목록 보기</Link>
            </Button>
          ) : (
            <Button asChild className="h-11 gap-1.5 px-4">
              <Link href="/patients/new">
                <UserPlus className="size-4" aria-hidden />
                첫 환자 등록하기
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[8.5rem]">등록번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead className="w-[9rem]">성별 / 나이</TableHead>
                  <TableHead className="w-[10rem]">주민등록번호</TableHead>
                  <TableHead className="w-[9rem]">병동 / 호실</TableHead>
                  <TableHead className="w-[8rem]">최근 평가</TableHead>
                  <TableHead className="w-[9rem]">
                    {showDeleted ? "삭제일" : "다음 평가"}
                  </TableHead>
                  <TableHead className="w-[4.5rem]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {patients.map((patient) => {
                  const completed = (patient.assessments ?? [])
                    .filter((a) => a.status === "completed")
                    .map((a) => a.assessed_at)
                    .sort()
                    .reverse();
                  const last = completed[0] ?? null;
                  const due = assessmentDue(last);
                  const badge = DUE_BADGE[due.status];
                  const assessmentCount = (patient.assessments ?? []).length;

                  const cells = (
                    <>
                      <TableCell className="font-mono text-sm">
                        {patient.patient_no}
                      </TableCell>
                      <TableCell>
                        {showDeleted ? (
                          <span className="font-medium">{patient.name}</span>
                        ) : (
                          <Link
                            href={`/patients/${patient.id}`}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {patient.name}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {describePatient(patient.sex, patient.birth_date)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {maskRrn(patient.rrn_front, patient.rrn_sex_digit)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {patient.room ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(last)}
                      </TableCell>
                      <TableCell>
                        {showDeleted ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDate(patient.deleted_at)}
                          </span>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={`${badge.className} font-normal`}
                          >
                            {badge.prefix ? `${badge.prefix} · ` : ""}
                            {due.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {showDeleted ? (
                          <RestorePatientButton
                            patientId={patient.id}
                            patientName={patient.name}
                          />
                        ) : (
                          <DeletePatientButton
                            patientId={patient.id}
                            patientName={patient.name}
                            assessmentCount={assessmentCount}
                            variant="icon"
                          />
                        )}
                      </TableCell>
                    </>
                  );

                  return showDeleted ? (
                    <TableRow key={patient.id} className="opacity-70">
                      {cells}
                    </TableRow>
                  ) : (
                    <PatientRow
                      key={patient.id}
                      href={`/patients/${patient.id}`}
                    >
                      {cells}
                    </PatientRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {showDeleted ? null : (
            <Link
              href="/patients?trash=1"
              className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="size-3.5" aria-hidden />
              삭제된 환자 보기
            </Link>
          )}
        </>
      )}
    </div>
  );
}
