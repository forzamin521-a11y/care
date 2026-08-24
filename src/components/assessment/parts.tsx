"use client";

import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/field";
import { cn } from "@/lib/utils";
import type { SectionMeta } from "@/lib/schemas/assessment";
import type { TermKey } from "@/lib/terms";

/** 섹션 카드 — 왼쪽 네비의 앵커가 된다 */
export function SectionCard({
  meta,
  filled,
  description,
  children,
}: {
  meta: SectionMeta;
  filled: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`section-${meta.key}`}
      className="print-section scroll-mt-[8.5rem] rounded-xl border bg-card"
    >
      <header className="flex items-start gap-3 border-b px-5 py-4">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-sm font-medium",
            filled
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          {meta.mark}
        </span>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[1.05rem] leading-tight font-semibold">
            {meta.title}
            {meta.titleEn ? (
              <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                ({meta.titleEn})
              </span>
            ) : null}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 py-5">{children}</div>
    </section>
  );
}

/**
 * 자주 쓰는 값 원클릭 칩.
 * 누르면 입력칸에 그 값이 들어간다. 직접 타이핑도 가능.
 */
export function ChipRow({
  options,
  value,
  onSelect,
  label,
}: {
  options: readonly string[];
  value: string;
  onSelect: (next: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {label ? (
        <span className="mr-0.5 text-xs text-muted-foreground">{label}</span>
      ) : null}
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(active ? "" : option)}
            aria-pressed={active}
            className={cn(
              "tap-sm rounded-full border px-3 py-1 text-[0.8rem] transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** 한 줄 텍스트 + 원클릭 칩 */
export function TextWithChips({
  id,
  label,
  term,
  hint,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label?: string;
  term?: TermKey;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  options?: readonly string[];
  placeholder?: string;
}) {
  return (
    <Field htmlFor={id} label={label} term={term} hint={hint}>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 text-base"
      />
      {options?.length ? (
        <ChipRow options={options} value={value} onSelect={onChange} />
      ) : null}
    </Field>
  );
}

/** 여러 줄 서술 */
export function LongText({
  id,
  label,
  term,
  hint,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  label?: string;
  term?: TermKey;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field htmlFor={id} label={label} term={term} hint={hint}>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="text-base leading-relaxed"
      />
    </Field>
  );
}

/** 예 / 아니오 / 미정 3단 선택 */
export function TriStateGroup({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean | null;
  onChange: (next: boolean | null) => void;
}) {
  const options: { key: string; label: string; value: boolean | null }[] = [
    { key: "yes", label: "예", value: true },
    { key: "no", label: "아니오", value: false },
    { key: "unset", label: "미정", value: null },
  ];

  return (
    <Field label={label} hint={hint}>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex w-fit gap-1.5 rounded-lg border p-1"
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-w-[4.5rem] rounded-md px-4 py-2 text-[0.95rem] transition-colors",
                active
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/** 큰 버튼형 단일 선택 (보행상태, 의식상태 등) */
export function OptionButtons<T extends string>({
  label,
  term,
  hint,
  value,
  onChange,
  options,
  columns = 2,
}: {
  label?: string;
  term?: TermKey;
  hint?: string;
  value: T | null;
  onChange: (next: T | null) => void;
  options: { key: T; label: string; en?: string; help?: string }[];
  columns?: number;
}) {
  return (
    <Field label={label} term={term} hint={hint}>
      <div
        role="radiogroup"
        aria-label={label ?? term ?? ""}
        className={cn(
          "grid gap-2",
          columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
        )}
      >
        {options.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? null : option.key)}
              className={cn(
                "flex min-h-[3rem] flex-col items-start gap-0.5 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                active
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <span className="flex items-center gap-1.5 text-[0.95rem] font-medium">
                {active ? (
                  <Check className="size-4 text-primary" aria-hidden />
                ) : null}
                {option.label}
                {option.en ? (
                  <span className="font-normal text-muted-foreground">
                    ({option.en})
                  </span>
                ) : null}
              </span>
              {option.help ? (
                <span className="text-xs leading-snug text-muted-foreground">
                  {option.help}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/** 여러 개 고르는 체크 그리드 (질병 15종) */
export function CheckGrid({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  options: { key: string; label: string; en?: string }[];
}) {
  const toggle = (key: string) => {
    onChange(
      value.includes(key) ? value.filter((v) => v !== key) : [...value, key]
    );
  };

  return (
    <Field label={label}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {options.map((option) => {
          const active = value.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(option.key)}
              className={cn(
                "flex min-h-[2.75rem] items-center gap-2 rounded-lg border px-3 py-2 text-left text-[0.9rem] transition-colors",
                active
                  ? "border-primary bg-accent font-medium"
                  : "border-border bg-card text-muted-foreground hover:bg-accent/50"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                  active ? "border-primary bg-primary" : "border-input"
                )}
                aria-hidden
              >
                {active ? (
                  <Check className="size-3 text-primary-foreground" />
                ) : null}
              </span>
              <span className="leading-tight break-keep">
                {option.label}
                {option.en ? (
                  <span className="ml-1 font-normal opacity-70">
                    ({option.en})
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}

/** 숫자 입력 + 단위 */
export function NumberInput({
  id,
  label,
  term,
  hint,
  value,
  onChange,
  unit,
  placeholder,
  step,
  warn,
}: {
  id: string;
  label?: string;
  term?: TermKey;
  hint?: string;
  value: number | null;
  onChange: (next: number | null) => void;
  unit?: string;
  placeholder?: string;
  step?: string;
  /** 이상치일 때 보여줄 문구 */
  warn?: string | null;
}) {
  return (
    <Field htmlFor={id} label={label} term={term} hint={hint}>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          placeholder={placeholder}
          className={cn(
            "h-11 max-w-[8rem] text-base tabular-nums",
            warn && "border-warn"
          )}
        />
        {unit ? (
          <span className="text-sm text-muted-foreground">{unit}</span>
        ) : null}
      </div>
      {warn ? (
        <p className="w-fit rounded-md bg-warn-soft px-2.5 py-1 text-xs">
          {warn}
        </p>
      ) : null}
    </Field>
  );
}
