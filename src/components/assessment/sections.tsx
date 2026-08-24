"use client";

import { memo } from "react";
import Link from "next/link";
import { Plus, Trash2, ClipboardCheck, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { cn } from "@/lib/utils";
import {
  DIAGNOSES,
  GAIT_STATUS,
  LAB_ITEMS,
  LIFESTYLE_PRESETS,
  MEDICATION_CATEGORIES,
  MENTAL_STATUS,
  VITAL_ALERTS,
  type GaitStatus,
  type MentalStatus,
} from "@/lib/constants";
import { TERMS } from "@/lib/terms";
import { calcBmi, type AssessmentData } from "@/lib/schemas/assessment";
import {
  SCALES,
  type ScaleCode,
  type ScaleSummary,
  type Severity,
} from "@/lib/scales";
import {
  CheckGrid,
  ChipRow,
  LongText,
  NumberInput,
  OptionButtons,
  TextWithChips,
  TriStateGroup,
} from "./parts";

type Patch<T> = (patch: Partial<T>) => void;

export type { ScaleSummary };

const SEVERITY_STYLE: Record<Severity, string> = {
  ok: "bg-ok-soft",
  warn: "bg-warn-soft",
  danger: "bg-danger-soft",
};

// =============================================================
// A. 진단명 (기존질병)
// =============================================================
export const SectionA = memo(function SectionA({
  value,
  patch,
}: {
  value: AssessmentData["a"];
  patch: Patch<AssessmentData["a"]>;
}) {
  return (
    <>
      <LongText
        id="a-admitReason"
        label="입소이유"
        hint="어떤 상황에서 입소하게 되었는지 적습니다."
        value={value.admitReason}
        onChange={(v) => patch({ admitReason: v })}
        placeholder="예: 배우자와 생활하시며 기억이 없고 욕창이 심해져 입소하심"
        rows={2}
      />

      <LongText
        id="a-clinicalDiagnosis"
        label="의료기관에 의한 진단명"
        value={value.clinicalDiagnosis}
        onChange={(v) => patch({ clinicalDiagnosis: v })}
        placeholder="예: 전립선 비대증, 치매"
        rows={2}
      />

      <CheckGrid
        label="해당하는 질병을 모두 고르세요"
        value={value.diagnoses}
        onChange={(v) => patch({ diagnoses: v })}
        options={DIAGNOSES}
      />

      {value.diagnoses.includes("other") ? (
        <Field htmlFor="a-diagnosisOther" label="기타 질병 내용">
          <Input
            id="a-diagnosisOther"
            value={value.diagnosisOther}
            onChange={(e) => patch({ diagnosisOther: e.target.value })}
            placeholder="기타로 표시한 질병을 적으세요"
            className="h-11 text-base"
          />
        </Field>
      ) : null}
    </>
  );
});

// =============================================================
// B. 과거력
// =============================================================
export const SectionB = memo(function SectionB({
  value,
  patch,
}: {
  value: AssessmentData["b"];
  patch: Patch<AssessmentData["b"]>;
}) {
  return (
    <>
      <LongText
        id="b-surgery"
        label="1) 주요 수술"
        hint="언제, 어떤 수술을 받았는지"
        value={value.surgery}
        onChange={(v) => patch({ surgery: v })}
        placeholder="예: 2018년 우측 고관절 인공관절 수술"
        rows={2}
      />
      <LongText
        id="b-admission"
        label="2) 급성기 병동 입원"
        hint="최근 큰 병원에 입원한 이력"
        value={value.admission}
        onChange={(v) => patch({ admission: v })}
        placeholder="예: 2025년 3월 폐렴으로 2주 입원"
        rows={2}
      />
      <LongText
        id="b-allergy"
        label="3) 알레르기"
        hint="약물·음식 알레르기. 없으면 '없음'이라고 적으세요."
        value={value.allergy}
        onChange={(v) => patch({ allergy: v })}
        placeholder="예: 페니실린 알레르기 / 없음"
        rows={2}
      />
    </>
  );
});

// =============================================================
// C. Life style
// =============================================================
export const SectionC = memo(function SectionC({
  value,
  patch,
}: {
  value: AssessmentData["c"];
  patch: Patch<AssessmentData["c"]>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextWithChips
        id="c-exercise"
        label="1) 운동"
        value={value.exercise}
        onChange={(v) => patch({ exercise: v })}
        options={LIFESTYLE_PRESETS.exercise}
      />
      <TextWithChips
        id="c-sleep"
        label="2) 수면"
        value={value.sleep}
        onChange={(v) => patch({ sleep: v })}
        options={LIFESTYLE_PRESETS.sleep}
      />
      <TextWithChips
        id="c-education"
        label="3) 교육정도"
        value={value.education}
        onChange={(v) => patch({ education: v })}
        options={LIFESTYLE_PRESETS.education}
      />
      <TextWithChips
        id="c-alcohol"
        label="4) 음주"
        value={value.alcohol}
        onChange={(v) => patch({ alcohol: v })}
        options={LIFESTYLE_PRESETS.alcohol}
      />
      <TextWithChips
        id="c-smoking"
        label="5) 흡연"
        value={value.smoking}
        onChange={(v) => patch({ smoking: v })}
        options={LIFESTYLE_PRESETS.smoking}
      />
      <TextWithChips
        id="c-diet"
        label="6) 식이"
        value={value.diet}
        onChange={(v) => patch({ diet: v })}
        options={LIFESTYLE_PRESETS.diet}
      />
    </div>
  );
});

// =============================================================
// D. Medical & Functional
// =============================================================
function ScaleRow({
  code,
  summary,
  assessmentId,
}: {
  code: ScaleCode;
  summary: ScaleSummary;
  assessmentId: string;
}) {
  const def = SCALES[code];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3.5 py-3">
      <div className="flex min-w-[13rem] flex-col gap-0.5">
        <span className="text-[0.95rem] font-medium">
          {def.name}
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            ({def.nameEn})
          </span>
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {def.purpose}
        </span>
      </div>

      {summary ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.95rem] font-medium tabular-nums">
            {summary.display}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs",
              SEVERITY_STYLE[summary.severity]
            )}
          >
            {summary.interpretation}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">미입력</span>
      )}

      <Button
        asChild
        variant={summary ? "ghost" : "outline"}
        size="sm"
        className="ml-auto h-9 gap-1.5"
      >
        <Link href={`/assessments/${assessmentId}/scales/${code}`}>
          {summary ? "다시 입력" : "입력하기"}
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

export const SectionD = memo(function SectionD({
  value,
  patch,
  assessmentId,
  scales,
}: {
  value: AssessmentData["d"];
  patch: Patch<AssessmentData["d"]>;
  assessmentId: string;
  scales: Partial<Record<ScaleCode, ScaleSummary>>;
}) {
  const bmi = calcBmi(value.heightCm, value.weightKg);

  const bmiWarn =
    bmi === null
      ? null
      : bmi < VITAL_ALERTS.bmi.low
        ? `BMI ${bmi} — 저체중입니다. 영양상태를 확인하세요.`
        : bmi > VITAL_ALERTS.bmi.high
          ? `BMI ${bmi} — 과체중입니다.`
          : null;

  const sbpWarn =
    value.sbp === null
      ? null
      : value.sbp >= VITAL_ALERTS.sbp.high
        ? "수축기 혈압이 높습니다. 확인이 필요합니다."
        : value.sbp <= VITAL_ALERTS.sbp.low
          ? "수축기 혈압이 낮습니다."
          : null;

  const pulseWarn =
    value.pulse === null
      ? null
      : value.pulse >= VITAL_ALERTS.pulse.high
        ? "맥박이 빠릅니다."
        : value.pulse <= VITAL_ALERTS.pulse.low
          ? "맥박이 느립니다."
          : null;

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <NumberInput
          id="d-height"
          label="키"
          value={value.heightCm}
          onChange={(v) => patch({ heightCm: v })}
          unit="cm"
          step="0.1"
        />
        <NumberInput
          id="d-weight"
          label="체중"
          value={value.weightKg}
          onChange={(v) => patch({ weightKg: v })}
          unit="kg"
          step="0.1"
          warn={bmiWarn}
        />
        <Field label={`${TERMS.BMI.ko} (${TERMS.BMI.en})`} hint="자동 계산">
          <div className="flex h-11 items-center rounded-md bg-muted px-3.5 font-mono text-base tabular-nums">
            {bmi ?? "-"}
          </div>
        </Field>
        <div />

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Field term="BP">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                aria-label="수축기 혈압"
                value={value.sbp ?? ""}
                onChange={(e) =>
                  patch({ sbp: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="127"
                className={cn(
                  "h-11 max-w-[6rem] text-base tabular-nums",
                  sbpWarn && "border-warn"
                )}
              />
              <span className="text-muted-foreground">/</span>
              <Input
                type="number"
                inputMode="numeric"
                aria-label="이완기 혈압"
                value={value.dbp ?? ""}
                onChange={(e) =>
                  patch({ dbp: e.target.value === "" ? null : Number(e.target.value) })
                }
                placeholder="84"
                className="h-11 max-w-[6rem] text-base tabular-nums"
              />
              <span className="text-sm text-muted-foreground">mmHg</span>
            </div>
            {sbpWarn ? (
              <p className="w-fit rounded-md bg-warn-soft px-2.5 py-1 text-xs">
                {sbpWarn}
              </p>
            ) : null}
          </Field>
        </div>

        <NumberInput
          id="d-pulse"
          term="PR"
          value={value.pulse}
          onChange={(v) => patch({ pulse: v })}
          unit="회/분"
          placeholder="98"
          warn={pulseWarn}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextWithChips
          id="d-vision"
          term="VISION"
          value={value.vision}
          onChange={(v) => patch({ vision: v })}
          options={["정상", "돋보기 사용", "잘 안 보임", "실명"]}
        />
        <TextWithChips
          id="d-hearing"
          term="HEARING"
          value={value.hearing}
          onChange={(v) => patch({ hearing: v })}
          options={["명료", "보청기 사용", "잘 안 들림", "난청 심함"]}
        />
        <TextWithChips
          id="d-incontinence"
          term="INCONTINENCE"
          value={value.incontinence}
          onChange={(v) => patch({ incontinence: v })}
          options={["없음", "소변 실금", "대변 실금", "기저귀 착용", "유치도뇨"]}
        />
        <TextWithChips
          id="d-constipation"
          term="CONSTIPATION"
          value={value.constipation}
          onChange={(v) => patch({ constipation: v })}
          options={["없음", "가끔 있음", "있음 (완하제 복용)"]}
        />
        <TextWithChips
          id="d-nutrition"
          term="NUTRITION"
          value={value.nutrition}
          onChange={(v) => patch({ nutrition: v })}
          options={["양호", "식사량 적음", "경관식", "체중 감소 있음"]}
          hint="식사량, 경관식 여부, 최근 체중 변화를 적습니다."
        />
      </div>

      <OptionButtons<GaitStatus>
        term="GAIT"
        value={(value.gait as GaitStatus | null) ?? null}
        onChange={(v) => patch({ gait: v })}
        options={GAIT_STATUS}
      />

      <div className="flex flex-col gap-3 rounded-lg bg-muted/60 p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-muted-foreground" aria-hidden />
          <h3 className="text-[0.95rem] font-medium">기능 평가 척도</h3>
          <span className="text-xs text-muted-foreground">
            웹으로 진행하거나, 종이로 실시한 뒤 점수만 입력할 수 있습니다.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {(["K_ADL", "K_IADL", "TUG"] as ScaleCode[]).map((code) => (
            <ScaleRow
              key={code}
              code={code}
              summary={scales[code] ?? null}
              assessmentId={assessmentId}
            />
          ))}
        </div>
      </div>
    </>
  );
});

// =============================================================
// E. Neuropsychiatric
// =============================================================
export const SectionE = memo(function SectionE({
  value,
  patch,
  assessmentId,
  scales,
}: {
  value: AssessmentData["e"];
  patch: Patch<AssessmentData["e"]>;
  assessmentId: string;
  scales: Partial<Record<ScaleCode, ScaleSummary>>;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        {(["SGDS_K", "K_MMSE"] as ScaleCode[]).map((code) => (
          <ScaleRow
            key={code}
            code={code}
            summary={scales[code] ?? null}
            assessmentId={assessmentId}
          />
        ))}
      </div>

      <OptionButtons<MentalStatus>
        term="MENTAL_STATUS"
        value={(value.mentalStatus as MentalStatus | null) ?? null}
        onChange={(v) => patch({ mentalStatus: v })}
        options={MENTAL_STATUS}
        columns={3}
      />

      <Field htmlFor="e-bpsd" term="BPSD">
        <Input
          id="e-bpsd"
          value={value.bpsd}
          onChange={(e) => patch({ bpsd: e.target.value })}
          placeholder="예: 배회, 야간 불면, 반복 질문"
          className="h-11 text-base"
        />
        <ChipRow
          options={[
            "없음",
            "배회",
            "망상",
            "환각",
            "공격성",
            "야간 불면",
            "반복 질문",
            "거부 행동",
          ]}
          value={value.bpsd}
          onSelect={(v) => patch({ bpsd: v })}
        />
      </Field>

      <LongText
        id="e-note"
        label="특이사항"
        value={value.note}
        onChange={(v) => patch({ note: v })}
        placeholder="신경정신 관련해서 기록해 둘 내용"
        rows={2}
      />
    </>
  );
});

// =============================================================
// F. Medication
// =============================================================
export const SectionF = memo(function SectionF({
  value,
  patch,
}: {
  value: AssessmentData["f"];
  patch: Patch<AssessmentData["f"]>;
}) {
  const byCategory = new Map(value.items.map((item) => [item.category, item]));

  const update = (category: string, drugName: string) => {
    const next = MEDICATION_CATEGORIES.map((cat) => {
      const existing = byCategory.get(cat.key);
      return {
        category: cat.key,
        drugName: cat.key === category ? drugName : (existing?.drugName ?? ""),
        note: existing?.note ?? "",
      };
    }).filter((item) => item.drugName.trim() || item.note.trim());

    patch({ items: next });
  };

  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {MEDICATION_CATEGORIES.map((cat) => {
        const item = byCategory.get(cat.key);
        const filled = Boolean(item?.drugName?.trim());

        return (
          <div key={cat.key} className="flex flex-col gap-1.5">
            <label
              htmlFor={`f-${cat.key}`}
              className="flex items-center gap-1.5 text-[0.9rem]"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  filled ? "bg-primary" : "bg-muted-foreground/30"
                )}
                aria-hidden
              />
              <span className={cn(filled && "font-medium")}>{cat.label}</span>
              {cat.help ? (
                <span className="text-xs text-muted-foreground">
                  {cat.help}
                </span>
              ) : null}
            </label>
            <Input
              id={`f-${cat.key}`}
              value={item?.drugName ?? ""}
              onChange={(e) => update(cat.key, e.target.value)}
              placeholder="약품명 (없으면 비워두세요)"
              className="h-11 text-base"
            />
          </div>
        );
      })}
    </div>
  );
});

// =============================================================
// G. 사전치료지시
// =============================================================
export const SectionG = memo(function SectionG({
  value,
  patch,
}: {
  value: AssessmentData["g"];
  patch: Patch<AssessmentData["g"]>;
}) {
  return (
    <>
      <div className="rounded-lg bg-warn-soft px-4 py-3 text-sm leading-relaxed">
        환자·보호자와 미리 상의해 정해 둔 내용을 기록합니다. 정해지지 않았으면
        <strong> 미정</strong>으로 두세요.
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <TriStateGroup
          label={`${TERMS.DNR.ko} (DNR)`}
          hint="임종 시 심폐소생술을 하지 않음"
          value={value.dnr}
          onChange={(v) => patch({ dnr: v })}
        />
        <TriStateGroup
          label="입원 거부"
          hint="상태 악화 시 큰 병원 이송을 원하지 않음"
          value={value.refuseAdmission}
          onChange={(v) => patch({ refuseAdmission: v })}
        />
        <TriStateGroup
          label="영양관 공급 거부"
          hint="콧줄·위루관 등을 통한 영양 공급을 원하지 않음"
          value={value.refuseTubeFeeding}
          onChange={(v) => patch({ refuseTubeFeeding: v })}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field htmlFor="g-agreedBy" label="결정한 사람">
          <Input
            id="g-agreedBy"
            value={value.agreedBy}
            onChange={(e) => patch({ agreedBy: e.target.value })}
            placeholder="예: 장남 김○○ (보호자)"
            className="h-11 text-base"
          />
        </Field>
        <Field htmlFor="g-agreedOn" label="결정일">
          <Input
            id="g-agreedOn"
            type="date"
            value={value.agreedOn}
            onChange={(e) => patch({ agreedOn: e.target.value })}
            className="h-11 max-w-[12rem] text-base"
          />
        </Field>
      </div>

      <LongText
        id="g-note"
        label="특이사항"
        value={value.note}
        onChange={(v) => patch({ note: v })}
        rows={2}
      />
    </>
  );
});

// =============================================================
// H. Problem list
// =============================================================
function ProblemList({
  title,
  help,
  items,
  onChange,
}: {
  title: string;
  help: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const rows = items.length > 0 ? items : [""];

  const setAt = (index: number, text: string) => {
    const next = [...rows];
    next[index] = text;
    onChange(next.filter((v, i) => v.trim() || i < next.length - 1));
  };

  const add = () => onChange([...rows, ""]);
  const removeAt = (index: number) =>
    onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[0.95rem] font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{help}</p>
      </div>

      <ol className="flex flex-col gap-2">
        {rows.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center font-mono text-sm text-muted-foreground">
              {index + 1}
            </span>
            <Input
              value={item}
              onChange={(e) => setAt(index, e.target.value)}
              placeholder="예: 욕창 (천골부, 2단계)"
              className="h-11 text-base"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeAt(index)}
              aria-label={`${index + 1}번 항목 삭제`}
              className="size-9 shrink-0 text-muted-foreground hover:text-danger"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </li>
        ))}
      </ol>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        className="h-9 w-fit gap-1.5"
      >
        <Plus className="size-4" aria-hidden />
        항목 추가
      </Button>
    </div>
  );
}

export const SectionH = memo(function SectionH({
  value,
  patch,
}: {
  value: AssessmentData["h"];
  patch: Patch<AssessmentData["h"]>;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProblemList
        title={`${TERMS.ACTIVE_PROBLEM.ko} (Active)`}
        help={TERMS.ACTIVE_PROBLEM.help ?? ""}
        items={value.active}
        onChange={(v) => patch({ active: v })}
      />
      <ProblemList
        title={`${TERMS.INACTIVE_PROBLEM.ko} (Inactive)`}
        help={TERMS.INACTIVE_PROBLEM.help ?? ""}
        items={value.inactive}
        onChange={(v) => patch({ inactive: v })}
      />
    </div>
  );
});

// =============================================================
// I. Management Plan
// =============================================================
export const SectionI = memo(function SectionI({
  value,
  patch,
}: {
  value: AssessmentData["i"];
  patch: Patch<AssessmentData["i"]>;
}) {
  const rows =
    value.rows.length > 0
      ? value.rows
      : [{ planDate: "", content: "", done: null, undoneReason: "" }];

  const setAt = (
    index: number,
    next: Partial<AssessmentData["i"]["rows"][number]>
  ) => {
    const updated = rows.map((row, i) =>
      i === index ? { ...row, ...next } : row
    );
    patch({ rows: updated });
  };

  const add = () =>
    patch({
      rows: [
        ...rows,
        { planDate: "", content: "", done: null, undoneReason: "" },
      ],
    });

  const removeAt = (index: number) =>
    patch({ rows: rows.filter((_, i) => i !== index) });

  return (
    <>
      <p className="text-sm text-muted-foreground">
        무엇을 관리할지 적고, 실제로 했는지 표시합니다. 못 했으면 이유를 남기세요.
      </p>

      <div className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-lg border px-3.5 py-3"
          >
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`i-date-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  일자
                </label>
                <Input
                  id={`i-date-${index}`}
                  type="date"
                  value={row.planDate}
                  onChange={(e) => setAt(index, { planDate: e.target.value })}
                  className="h-10 w-[10.5rem] text-sm"
                />
              </div>

              <div className="flex min-w-[16rem] flex-1 flex-col gap-1.5">
                <label
                  htmlFor={`i-content-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  주요 관리 사항
                </label>
                <Input
                  id={`i-content-${index}`}
                  value={row.content}
                  onChange={(e) => setAt(index, { content: e.target.value })}
                  placeholder="예: 2시간마다 체위변경, 욕창 드레싱 매일"
                  className="h-10 text-base"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground">완수 여부</span>
                <div className="flex gap-1 rounded-md border p-0.5">
                  {[
                    { label: "완수", v: true },
                    { label: "미완", v: false },
                    { label: "-", v: null },
                  ].map((option) => {
                    const active = row.done === option.v;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => setAt(index, { done: option.v })}
                        aria-pressed={active}
                        className={cn(
                          "tap-sm rounded px-2.5 py-1.5 text-sm transition-colors",
                          active
                            ? option.v === true
                              ? "bg-ok text-ok-foreground"
                              : option.v === false
                                ? "bg-warn text-warn-foreground"
                                : "bg-muted"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAt(index)}
                aria-label={`${index + 1}번 계획 삭제`}
                className="mt-6 size-9 shrink-0 text-muted-foreground hover:text-danger"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>

            {row.done === false ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor={`i-reason-${index}`}
                  className="text-xs text-muted-foreground"
                >
                  불이행 이유
                </label>
                <Input
                  id={`i-reason-${index}`}
                  value={row.undoneReason}
                  onChange={(e) =>
                    setAt(index, { undoneReason: e.target.value })
                  }
                  placeholder="예: 보호자 면회 일정으로 연기"
                  className="h-10 text-base"
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        className="h-9 w-fit gap-1.5"
      >
        <Plus className="size-4" aria-hidden />
        계획 추가
      </Button>
    </>
  );
});

// =============================================================
// J. Initial Lab & X-ray
// =============================================================
export const SectionJ = memo(function SectionJ({
  value,
  patch,
}: {
  value: AssessmentData["j"];
  patch: Patch<AssessmentData["j"]>;
}) {
  const setItem = (
    code: string,
    next: Partial<{ value: string; takenOn: string; abnormal: boolean }>
  ) => {
    const current = value.items[code] ?? {
      value: "",
      takenOn: "",
      abnormal: false,
    };
    patch({
      items: { ...value.items, [code]: { ...current, ...next } },
    });
  };

  return (
    <>
      <p className="text-sm text-muted-foreground">
        시행한 검사만 적으면 됩니다. 이상 소견이 있으면 오른쪽을 체크하세요.
      </p>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/60">
              <th className="w-[16rem] px-3 py-2.5 text-left font-medium">
                검사
              </th>
              <th className="px-3 py-2.5 text-left font-medium">결과</th>
              <th className="w-[10rem] px-3 py-2.5 text-left font-medium">
                시행일
              </th>
              <th className="w-[5rem] px-3 py-2.5 text-center font-medium">
                이상
              </th>
            </tr>
          </thead>
          <tbody>
            {LAB_ITEMS.map((lab) => {
              const term = TERMS[lab.term];
              const item = value.items[lab.code] ?? {
                value: "",
                takenOn: "",
                abnormal: false,
              };

              return (
                <tr key={lab.code} className="border-b last:border-b-0">
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[0.9rem] font-medium">
                        {term.ko}
                        <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">
                          {term.en}
                        </span>
                      </span>
                      {term.help ? (
                        <span className="text-xs leading-snug text-muted-foreground">
                          {term.help}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.value}
                        onChange={(e) =>
                          setItem(lab.code, { value: e.target.value })
                        }
                        aria-label={`${term.ko} 결과`}
                        className="h-10 text-base"
                      />
                      {lab.unit ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {lab.unit}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="date"
                      value={item.takenOn}
                      onChange={(e) =>
                        setItem(lab.code, { takenOn: e.target.value })
                      }
                      aria-label={`${term.ko} 시행일`}
                      className="h-10 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={item.abnormal}
                      onChange={(e) =>
                        setItem(lab.code, { abnormal: e.target.checked })
                      }
                      aria-label={`${term.ko} 이상 소견`}
                      className="size-5 accent-[var(--danger)]"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <LongText
        id="j-note"
        label="참고사항"
        value={value.note}
        onChange={(v) => patch({ note: v })}
        rows={2}
      />
    </>
  );
});

