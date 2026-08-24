"use client";

import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 인쇄 화면 상단 도구막대.
 * 인쇄물에는 나오지 않는다 (.no-print).
 */
export function PrintToolbar({
  title,
  hint = "브라우저 인쇄 창에서 용지를 A4, 여백을 기본값으로 두세요.",
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-[0.95rem] font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-11 gap-1.5 px-4 text-[0.95rem]"
        >
          <Printer className="size-4" aria-hidden />
          인쇄
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.close()}
          className="h-11 gap-1.5 px-3 text-[0.95rem]"
        >
          <X className="size-4" aria-hidden />
          닫기
        </Button>
      </div>
    </div>
  );
}
