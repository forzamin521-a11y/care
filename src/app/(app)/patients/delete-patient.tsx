"use client";

import { Trash2, RotateCcw } from "lucide-react";
import { softDeletePatientAction, restorePatientAction } from "./actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * 환자 삭제 버튼 + 확인 창.
 *
 * 실제로 지우지 않고 목록에서만 감춘다 (진료기록 보존의무).
 * 삭제 후에는 목록의 "삭제된 환자 보기" 에서 되돌릴 수 있다.
 */
export function DeletePatientButton({
  patientId,
  patientName,
  assessmentCount = 0,
  variant = "button",
}: {
  patientId: string;
  patientName: string;
  /** 평가 기록 수 — 있으면 경고를 더 강하게 보여준다 */
  assessmentCount?: number;
  variant?: "button" | "icon";
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${patientName} 삭제`}
            className="size-9 text-muted-foreground hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-1.5 px-4 text-muted-foreground hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" aria-hidden />
            환자 삭제
          </Button>
        )}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {patientName} 님을 목록에서 삭제할까요?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2 text-left">
              <p>
                진료기록은 법으로 정해진 보존기간이 있어 <strong>실제로 지우지
                않습니다.</strong> 목록에서만 사라지고, 언제든 되돌릴 수 있습니다.
              </p>
              {assessmentCount > 0 ? (
                <p className="rounded-md bg-warn-soft px-3 py-2 text-sm text-foreground">
                  이 환자에게 작성된 평가가 {assessmentCount}건 있습니다. 평가
                  기록도 함께 목록에서 감춰집니다.
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">취소</AlertDialogCancel>
          <form action={softDeletePatientAction}>
            <input type="hidden" name="patientId" value={patientId} />
            <AlertDialogAction
              type="submit"
              className="h-11 bg-danger text-danger-foreground hover:bg-danger/90"
            >
              삭제
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 삭제한 환자를 되돌리는 버튼 */
export function RestorePatientButton({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  return (
    <form action={restorePatientAction}>
      <input type="hidden" name="patientId" value={patientId} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5"
        aria-label={`${patientName} 되돌리기`}
      >
        <RotateCcw className="size-3.5" aria-hidden />
        되돌리기
      </Button>
    </form>
  );
}
