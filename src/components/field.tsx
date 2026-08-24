"use client";

import { Info, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TERMS, type TermKey } from "@/lib/terms";

type FieldProps = {
  /** input 의 id — label 과 연결된다 */
  htmlFor?: string;
  /** 직접 라벨 문자열을 줄 때 */
  label?: string;
  /** 용어 사전 키를 주면 "한글 (English)" + 도움말 툴팁이 자동으로 붙는다 */
  term?: TermKey;
  /** 입력칸 아래 보조 설명 */
  hint?: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  htmlFor,
  label,
  term,
  hint,
  required,
  error,
  className,
  children,
}: FieldProps) {
  const dict = term ? TERMS[term] : null;
  const text = label ?? dict?.ko ?? "";
  const english = dict && dict.ko !== dict.en ? dict.en : null;
  const help = dict?.help;

  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-[0.95rem] leading-snug">
          {text}
          {english ? (
            <span className="ml-1 font-normal text-muted-foreground">
              ({english})
            </span>
          ) : null}
          {required ? (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          ) : null}
        </Label>

        {help ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="tap-sm inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
                aria-label={`${text} 설명 보기`}
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[16rem] text-[0.8rem] leading-relaxed">
              {help}
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      {children}

      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1.5 text-xs text-danger"
        >
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
