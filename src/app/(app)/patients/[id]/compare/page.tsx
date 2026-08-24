import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseAssessmentData, calcBmi } from "@/lib/schemas/assessment";
import { GAIT_STATUS, MENTAL_STATUS } from "@/lib/constants";
import {
  SCALES,
  SCALE_ORDER,
  compareScores,
  isScaleCode,
  type ScaleCode,
} from "@/lib/scales";
import { describePatient } from "@/lib/rrn";
import { formatDate } from "@/lib/due";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "회차 비교" };

type Row = {
  label: string;
  before: string;
  after: string;
  delta?: {
    label: string;
    trend: "better" | "worse" | "same";
  };
};

function DeltaBadge({
  delta,
}: {
  delta?: { label: string; trend: "better" | "worse" | "same" };
}) {
  if (!delta) return <span className="text-muted-foreground">-</span>;

  if (delta.trend === "same") {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="size-3.5" aria-hidden />
        변화 없음
      </span>
    );
  }

  const worse = delta.trend === "worse";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm",
        worse ? "bg-danger-soft" : "bg-ok-soft"
      )}
    >
      {delta.label.startsWith("▲") ? (
        <ArrowUp className="size-3.5" aria-hidden />
      ) : (
        <ArrowDown className="size-3.5" aria-hidden />
      )}
      {delta.label.replace(/^[▲▼]\s*/, "")}
    </span>
  );
}

export default async function ComparePage(
  props: PageProps<"/patients/[id]/compare">
) {
  const { id } = await props.params;
  const search = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, name, patient_no, sex, birth_date")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!patient) notFound();

  const { data: allRows } = await supabase
    .from("assessments")
    .select("id, seq, kind, status, assessed_at, data")
    .eq("patient_id", id)
    .is("deleted_at", null)
    .order("seq", { ascending: false });

  const all = allRows ?? [];

  if (all.length < 2) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Link
          href={`/patients/${patient.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {patient.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">회차 비교</h1>
        <p className="rounded-lg border border-dashed px-6 py-12 text-center text-muted-foreground">
          비교하려면 평가가 2회 이상 있어야 합니다. 지금은 {all.length}회
          작성되었습니다.
        </p>
      </div>
    );
  }

  const pickId = (key: string, fallback: string) => {
    const raw = search[key];
    const value = typeof raw === "string" ? raw : "";
    return all.some((a) => a.id === value) ? value : fallback;
  };

  // 기본값: 최신 회차(after) 와 그 직전 회차(before)
  const afterId = pickId("b", all[0].id);
  const beforeId = pickId("a", all.find((a) => a.id !== afterId)?.id ?? all[1].id);

  const after = all.find((a) => a.id === afterId)!;
  const before = all.find((a) => a.id === beforeId)!;

  const dataBefore = parseAssessmentData(before.data);
  const dataAfter = parseAssessmentData(after.data);

  // ---------- 척도 결과 ----------
  const { data: scaleRows } = await supabase
    .from("scale_results")
    .select("assessment_id, scale_code, total_score, interpretation")
    .in("assessment_id", [before.id, after.id])
    .is("deleted_at", null);

  const scaleMap = new Map<string, { total: number; interpretation: string }>();
  for (const row of scaleRows ?? []) {
    scaleMap.set(`${row.assessment_id}:${row.scale_code}`, {
      total: Number(row.total_score ?? 0),
      interpretation: row.interpretation ?? "",
    });
  }

  // ---------- 비교 행 만들기 ----------
  const rows: Row[] = [];

  const numericRow = (
    label: string,
    a: number | null,
    b: number | null,
    unit: string,
    higherWorse: boolean
  ) => {
    const row: Row = {
      label,
      before: a === null ? "-" : `${a}${unit}`,
      after: b === null ? "-" : `${b}${unit}`,
    };

    if (a !== null && b !== null) {
      const diff = Math.round((b - a) * 10) / 10;
      row.delta =
        diff === 0
          ? { label: "변화 없음", trend: "same" }
          : {
              label: `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}${unit}`,
              trend:
                (higherWorse && diff > 0) || (!higherWorse && diff < 0)
                  ? "worse"
                  : "better",
            };
    }
    return row;
  };

  rows.push(
    numericRow("체중", dataBefore.d.weightKg, dataAfter.d.weightKg, "kg", false)
  );
  rows.push(
    numericRow(
      "BMI",
      calcBmi(dataBefore.d.heightCm, dataBefore.d.weightKg),
      calcBmi(dataAfter.d.heightCm, dataAfter.d.weightKg),
      "",
      false
    )
  );
  rows.push({
    label: "혈압",
    before: `${dataBefore.d.sbp ?? "-"}/${dataBefore.d.dbp ?? "-"}`,
    after: `${dataAfter.d.sbp ?? "-"}/${dataAfter.d.dbp ?? "-"}`,
  });
  rows.push(numericRow("맥박", dataBefore.d.pulse, dataAfter.d.pulse, "회/분", true));

  // 척도
  for (const code of SCALE_ORDER) {
    if (!isScaleCode(code)) continue;
    const def = SCALES[code];
    const a = scaleMap.get(`${before.id}:${code}`);
    const b = scaleMap.get(`${after.id}:${code}`);

    const row: Row = {
      label: `${def.name} (${def.nameEn})`,
      before: a ? `${a.total}${def.unit}` : "-",
      after: b ? `${b.total}${def.unit}` : "-",
    };

    if (a && b) {
      const delta = compareScores(code as ScaleCode, a.total, b.total);
      row.delta = { label: delta.label, trend: delta.trend };
    }
    rows.push(row);
  }

  const gaitLabel = (key: string | null) =>
    GAIT_STATUS.find((g) => g.key === key)?.label ?? "-";
  const mentalLabel = (key: string | null) =>
    MENTAL_STATUS.find((m) => m.key === key)?.label ?? "-";

  rows.push({
    label: "환자 보행상태",
    before: gaitLabel(dataBefore.d.gait),
    after: gaitLabel(dataAfter.d.gait),
  });
  rows.push({
    label: "의식 · 지남력",
    before: mentalLabel(dataBefore.e.mentalStatus),
    after: mentalLabel(dataAfter.e.mentalStatus),
  });
  rows.push({
    label: "치매행동심리증상 (BPSD)",
    before: dataBefore.e.bpsd || "-",
    after: dataAfter.e.bpsd || "-",
  });
  rows.push({
    label: "진행 중인 문제 수",
    before: `${dataBefore.h.active.filter((v) => v.trim()).length}건`,
    after: `${dataAfter.h.active.filter((v) => v.trim()).length}건`,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-col gap-2">
        <Link
          href={`/patients/${patient.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {patient.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">회차 비교</h1>
        <p className="text-sm text-muted-foreground">
          {patient.name} · {describePatient(patient.sex, patient.birth_date)}
        </p>
      </div>

      {/* 회차 선택 */}
      <form
        action={`/patients/${patient.id}/compare`}
        className="no-print flex flex-wrap items-end gap-3 rounded-xl border bg-card px-5 py-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="a" className="text-sm text-muted-foreground">
            이전 회차
          </label>
          <select
            id="a"
            name="a"
            defaultValue={before.id}
            className="h-11 rounded-md border bg-background px-3 text-base"
          >
            {all.map((a) => (
              <option key={a.id} value={a.id}>
                {a.seq}차 · {formatDate(a.assessed_at)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="b" className="text-sm text-muted-foreground">
            비교할 회차
          </label>
          <select
            id="b"
            name="b"
            defaultValue={after.id}
            className="h-11 rounded-md border bg-background px-3 text-base"
          >
            {all.map((a) => (
              <option key={a.id} value={a.id}>
                {a.seq}차 · {formatDate(a.assessed_at)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="h-11 rounded-md border px-4 text-[0.95rem] transition-colors hover:bg-accent"
        >
          비교
        </button>
      </form>

      {/* 비교표 */}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-[16rem] px-4 py-3 text-left font-medium">항목</th>
              <th className="w-[11rem] px-4 py-3 text-left font-medium">
                {before.seq}차
                <span className="ml-1.5 font-normal text-muted-foreground">
                  {formatDate(before.assessed_at)}
                </span>
              </th>
              <th className="w-[11rem] px-4 py-3 text-left font-medium">
                {after.seq}차
                <span className="ml-1.5 font-normal text-muted-foreground">
                  {formatDate(after.assessed_at)}
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium">변화</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">{row.label}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">
                  {row.before}
                </td>
                <td className="px-4 py-3 font-mono">{row.after}</td>
                <td className="px-4 py-3">
                  <DeltaBadge delta={row.delta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        점수가 오르는 것이 좋은지 나쁜지는 검사마다 다릅니다. K-MMSE 는 점수가
        높을수록 좋고, 나머지는 점수가 높을수록 상태가 나쁜 쪽입니다.
        <Badge variant="outline" className="ml-2 font-normal">
          호전 / 악화는 이 기준으로 표시됩니다
        </Badge>
      </p>
    </div>
  );
}
