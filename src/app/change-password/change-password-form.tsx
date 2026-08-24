"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, KeyRound } from "lucide-react";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "./actions";
import { PASSWORD_RULES } from "@/lib/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ forced }: { forced: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={pending}>
      {pending ? (
        "변경 중…"
      ) : (
        <>
          <KeyRound className="size-5" aria-hidden />
          {forced ? "비밀번호 변경하고 시작하기" : "비밀번호 변경"}
        </>
      )}
    </Button>
  );
}

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction] = useActionState<ChangePasswordState, FormData>(
    changePasswordAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword" className="text-[0.95rem]">
          현재 비밀번호
        </Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword" className="text-[0.95rem]">
          새 비밀번호
        </Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className="h-12 text-base"
          aria-describedby="password-rules"
        />
        <ul
          id="password-rules"
          className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground"
        >
          {PASSWORD_RULES.map((rule) => (
            <li key={rule} className="flex items-center gap-1.5">
              <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword" className="text-[0.95rem]">
          새 비밀번호 확인
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="h-12 text-base"
        />
      </div>

      {state.errors?.length ? (
        <div
          role="alert"
          className="flex flex-col gap-1.5 rounded-md bg-danger-soft px-3 py-2.5 text-sm"
        >
          {state.errors.map((error) => (
            <p key={error} className="flex items-start gap-2">
              <AlertCircle
                className="mt-0.5 size-4 shrink-0 text-danger"
                aria-hidden
              />
              {error}
            </p>
          ))}
        </div>
      ) : null}

      <SubmitButton forced={forced} />
    </form>
  );
}
