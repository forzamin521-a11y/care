"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ClipboardList,
  Copyright,
  Loader2,
  Printer,
  Save,
} from "lucide-react";
import {
  saveScaleResultAction,
  type SaveScaleState,
} from "@/app/(app)/assessments/scale-actions";
import {
  NOT_APPLICABLE,
  findBand,
  scoreDomainScale,
  scoreItemScale,
  type ItemScaleDef,
  type ScaleDef,
  type Severity,
} from "@/lib/scales";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Mode = "web" | "score_only" | "paper";

const SEVERITY_STYLE: Record<Severity, string> = {
  ok: "bg-ok-soft",
  warn: "bg-warn-soft",
  danger: "bg-danger-soft",
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 gap-2 px-6 text-base"
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <Save className="size-5" aria-hidden />
      )}
      {label}
    </Button>
  );
}

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md bg-danger-soft px-3.5 py-3 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
      {error}
    </p>
  );
}

/** 점수 + 해석 배지 */
function ScorePreview({
  display,
  interpretation,
  severity,
}: {
  display: string;
  interpretation: string;
  severity: Severity;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-4 py-3.5",
        SEVERITY_STYLE[severity]
      )}
    >
      <span className="font-mono text-xl font-semibold tabular-nums">
        {display}
      </span>
      <span className="text-[0.95rem]">{interpretation}</span>
    </div>
  );
}

// =============================================================
// 웹 진행 — 한 문항씩
// =============================================================
function WebWizard({
  def,
  assessmentId,
  state,
  formAction,
}: {
  def: ItemScaleDef;
  assessmentId: string;
  state: SaveScaleState;
  formAction: (formData: FormData) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [index, setIndex] = useState(0);

  const total = def.items.length;
  const answeredCount = Object.keys(answers).length;
  const done = answeredCount === total;
  const item = def.items[index];

  const outcome = useMemo(
    () => scoreItemScale(def, answers),
    [def, answers]
  );

  const choose = (value: number) => {
    setAnswers((prev) => ({ ...prev, [item.no]: value }));
    // 마지막 문항이 아니면 자동으로 다음으로
    if (index < total - 1) {
      window.setTimeout(() => setIndex((i) => Math.min(i + 1, total - 1)), 140);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 진행률 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">
            {done ? "모두 응답했습니다" : `${index + 1}번 문항`}
          </span>
          <span className="font-mono text-sm tabular-nums">
            {answeredCount} / {total}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 문항 */}
      <div className="flex flex-col gap-5 rounded-xl border bg-card px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-sm text-muted-foreground">
            {item.no}
            {item.reverse ? " ★" : ""}
          </span>
          <h2 className="text-xl leading-relaxed font-medium sm:text-[1.4rem]">
            {item.text}
          </h2>
          {item.hint ? (
            <p className="text-[0.95rem] text-muted-foreground">{item.hint}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5">
          {def.choices.map((choice) => {
            const active = answers[item.no] === choice.value;
            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => choose(choice.value)}
                aria-pressed={active}
                className={cn(
                  "flex min-h-[3.5rem] items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-primary bg-accent"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-primary bg-primary" : "border-input"
                  )}
                  aria-hidden
                >
                  {active ? (
                    <Check className="size-4 text-primary-foreground" />
                  ) : null}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[1.05rem] font-medium">
                    {choice.label}
                  </span>
                  {choice.hint ? (
                    <span className="text-sm text-muted-foreground">
                      {choice.hint}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}

          {def.allowNotApplicable ? (
            <button
              type="button"
              onClick={() => choose(NOT_APPLICABLE)}
              aria-pressed={answers[item.no] === NOT_APPLICABLE}
              className={cn(
                "flex min-h-[3rem] items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-left transition-colors",
                answers[item.no] === NOT_APPLICABLE
                  ? "border-primary bg-accent"
                  : "hover:bg-accent/50"
              )}
            >
              <span className="text-[1rem] text-muted-foreground">
                해당없음 — 채점에서 제외합니다
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 이동 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          이전
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
          disabled={index === total - 1}
        >
          다음
        </Button>

        <div className="ml-auto flex flex-wrap gap-1">
          {def.items.map((it, i) => (
            <button
              key={it.no}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`${it.no}번 문항으로`}
              className={cn(
                "tap-sm size-7 rounded text-xs tabular-nums transition-colors",
                i === index
                  ? "bg-foreground text-background"
                  : answers[it.no] !== undefined
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {it.no}
            </button>
          ))}
        </div>
      </div>

      {/* 결과 + 저장 */}
      {done ? (
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="assessmentId" value={assessmentId} />
          <input type="hidden" name="code" value={def.code} />
          <input type="hidden" name="entryMode" value="web" />
          <input
            type="hidden"
            name="answers"
            value={JSON.stringify(answers)}
          />

          <ScorePreview
            display={outcome.display}
            interpretation={outcome.interpretation}
            severity={outcome.severity}
          />

          <div className="flex flex-col gap-2">
            <Label htmlFor="note" className="text-[0.95rem]">
              메모 (선택)
            </Label>
            <Textarea
              id="note"
              name="note"
              rows={2}
              placeholder="검사 중 특이사항이 있으면 적으세요"
              className="text-base"
            />
          </div>

          <ErrorNote error={state.error} />
          <SubmitButton label="결과 저장" />
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          모든 문항에 응답하면 점수와 해석이 자동으로 계산됩니다.
        </p>
      )}
    </div>
  );
}

// =============================================================
// 점수만 입력
// =============================================================
function ScoreOnlyForm({
  def,
  assessmentId,
  state,
  formAction,
}: {
  def: ScaleDef;
  assessmentId: string;
  state: SaveScaleState;
  formAction: (formData: FormData) => void;
}) {
  const [domainScores, setDomainScores] = useState<Record<string, number>>({});
  const [total, setTotal] = useState<string>("");

  const preview = useMemo(() => {
    if (def.kind === "domains") {
      return scoreDomainScale(def, domainScores);
    }
    const value = Number(total);
    if (total === "" || !Number.isFinite(value)) return null;
    const band = findBand(def, value);
    return {
      total: value,
      display:
        def.kind === "numeric"
          ? `${value}${def.unit}`
          : `${value} / ${def.scoreRange.max}${def.unit}`,
      interpretation: band.label,
      severity: band.severity,
    };
  }, [def, domainScores, total]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <input type="hidden" name="code" value={def.code} />
      <input type="hidden" name="entryMode" value="score_only" />

      {def.kind === "domains" ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            영역별 점수를 입력하면 총점이 자동으로 더해집니다.
          </p>

          <div className="overflow-hidden rounded-lg border">
            {def.domains.map((domain, i) => (
              <div
                key={domain.key}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3",
                  i > 0 && "border-t"
                )}
              >
                <div className="flex min-w-[12rem] flex-1 flex-col gap-0.5">
                  <Label
                    htmlFor={`domain-${domain.key}`}
                    className="text-[0.95rem]"
                  >
                    {domain.label}
                  </Label>
                  {domain.hint ? (
                    <span className="text-xs text-muted-foreground">
                      {domain.hint}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    id={`domain-${domain.key}`}
                    name={`domain-${domain.key}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={domain.max}
                    value={domainScores[domain.key] ?? ""}
                    onChange={(e) =>
                      setDomainScores((prev) => ({
                        ...prev,
                        [domain.key]:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    className="h-11 w-[5rem] text-center text-base tabular-nums"
                  />
                  <span className="w-12 text-sm text-muted-foreground">
                    / {domain.max}점
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="total" className="text-[0.95rem]">
            {def.kind === "numeric" ? "측정값" : "총점"}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="total"
              name="total"
              type="number"
              inputMode="decimal"
              step={def.scoreRange.step}
              min={def.scoreRange.min}
              max={def.scoreRange.max}
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              required
              className="h-12 w-[8rem] text-center text-lg tabular-nums"
            />
            <span className="text-sm text-muted-foreground">
              {def.unit} ({def.scoreRange.min} ~ {def.scoreRange.max})
            </span>
          </div>
        </div>
      )}

      {preview ? (
        <ScorePreview
          display={preview.display}
          interpretation={preview.interpretation}
          severity={preview.severity}
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="note-score" className="text-[0.95rem]">
          메모 (선택)
        </Label>
        <Textarea
          id="note-score"
          name="note"
          rows={2}
          placeholder="예: 종이 설문지로 2026-08-20 실시"
          className="text-base"
        />
      </div>

      <ErrorNote error={state.error} />
      <SubmitButton label="결과 저장" />
    </form>
  );
}

// =============================================================
// 모드 전환 껍데기
// =============================================================
export function ScaleEntry({
  def,
  assessmentId,
  patientName,
}: {
  def: ScaleDef;
  assessmentId: string;
  patientName: string;
}) {
  const [mode, setMode] = useState<Mode>(
    def.webEnabled ? "web" : "score_only"
  );
  const [state, formAction] = useActionState<SaveScaleState, FormData>(
    saveScaleResultAction,
    {}
  );

  const modes: { key: Mode; label: string; help: string; disabled?: boolean }[] =
    [
      {
        key: "web",
        label: "웹으로 진행",
        help: "한 문항씩 화면에서 진행합니다",
        disabled: !def.webEnabled,
      },
      {
        key: "score_only",
        label: "점수만 입력",
        help: "종이로 실시한 뒤 결과만 입력합니다",
      },
      {
        key: "paper",
        label: "빈 설문지 인쇄",
        help: "A4 로 출력해 현장에서 실시합니다",
      },
    ];

  return (
    <div className="flex flex-col gap-6">
      {/* 모드 선택 */}
      <div
        role="tablist"
        aria-label="입력 방식"
        className="no-print grid gap-2 sm:grid-cols-3"
      >
        {modes.map((option) => {
          const active = mode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={option.disabled}
              onClick={() => setMode(option.key)}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-left transition-colors",
                active
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-accent/50",
                option.disabled && "cursor-not-allowed opacity-45"
              )}
            >
              <span className="text-[0.95rem] font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.disabled ? "이 검사는 지원하지 않습니다" : option.help}
              </span>
            </button>
          );
        })}
      </div>

      {/* 저작권 안내 (K-MMSE) */}
      {!def.webEnabled && def.webDisabledReason ? (
        <div className="flex items-start gap-3 rounded-lg bg-warn-soft px-4 py-3.5 text-sm leading-relaxed">
          <Copyright className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p>{def.webDisabledReason}</p>
        </div>
      ) : null}

      {mode === "web" && def.kind === "items" ? (
        <WebWizard
          def={def}
          assessmentId={assessmentId}
          state={state}
          formAction={formAction}
        />
      ) : null}

      {mode === "score_only" ? (
        <ScoreOnlyForm
          def={def}
          assessmentId={assessmentId}
          state={state}
          formAction={formAction}
        />
      ) : null}

      {mode === "paper" ? (
        <div className="flex flex-col gap-4 rounded-xl border bg-card px-5 py-6">
          <div className="flex items-start gap-3">
            <ClipboardList
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="flex flex-col gap-1">
              <h2 className="text-[1.05rem] font-medium">빈 설문지 인쇄</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                환자 이름과 오늘 날짜가 인쇄된 빈 설문지를 A4 로 출력합니다.
                현장에서 실시한 뒤 <strong>&ldquo;점수만 입력&rdquo;</strong>{" "}
                탭에서 결과를 넣으세요.
              </p>
            </div>
          </div>

          {def.kind === "domains" ? (
            <p className="rounded-md bg-muted px-3.5 py-3 text-sm leading-relaxed">
              {def.nameEn} 는 저작권 때문에 문항을 인쇄할 수 없습니다. 병원에서
              보유한 정식 용지를 사용하고, 여기서는 영역별 점수만 입력하세요.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="h-12 w-fit gap-2 px-5 text-base">
                <Link
                  href={`/print/scale/${def.code}?name=${encodeURIComponent(patientName)}`}
                  target="_blank"
                >
                  <Printer className="size-5" aria-hidden />
                  빈 설문지 인쇄하기
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                여러 종류를 한 번에 뽑거나 여러 부가 필요하면 상단 메뉴의{" "}
                <Link
                  href="/forms"
                  className="text-primary underline underline-offset-4"
                >
                  설문지 인쇄
                </Link>
                를 쓰세요.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <Button
        asChild
        variant="ghost"
        className="no-print h-11 w-fit gap-1.5 px-3"
      >
        <Link href={`/assessments/${assessmentId}/edit`}>
          <ArrowLeft className="size-4" aria-hidden />
          평가로 돌아가기
        </Link>
      </Button>
    </div>
  );
}
