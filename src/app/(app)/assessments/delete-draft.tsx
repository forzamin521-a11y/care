"use client";

import { Trash2 } from "lucide-react";
import { deleteDraftAssessmentAction } from "./actions";
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
 * 작성 중인 평가를 지우는 버튼.
 * 잘못 눌러 만들어진 빈 평가를 치우는 용도라 완료된 평가에는 붙이지 않는다.
 */
export function DeleteDraftButton({
  assessmentId,
  seq,
  hasContent,
}: {
  assessmentId: string;
  seq: number;
  /** 내용이 들어 있으면 경고를 더 분명하게 보여준다 */
  hasContent?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${seq}차 작성 중 평가 삭제`}
          className="size-9 shrink-0 text-muted-foreground hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            작성 중인 {seq}차 평가를 지울까요?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-2 text-left">
              <p>
                잘못 눌러 만들어진 평가를 치울 때 쓰세요. 목록에서 사라지며,
                다음 평가는 이 번호부터 다시 시작합니다.
              </p>
              {hasContent ? (
                <p className="rounded-md bg-warn-soft px-3 py-2 text-sm text-foreground">
                  이 평가에는 이미 입력한 내용이 있습니다. 지우면 화면에서
                  보이지 않습니다.
                </p>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="h-11">취소</AlertDialogCancel>
          <form action={deleteDraftAssessmentAction}>
            <input type="hidden" name="assessmentId" value={assessmentId} />
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
