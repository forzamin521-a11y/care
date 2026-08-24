import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/server";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = { title: "비밀번호 변경" };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const forced = user.user_metadata?.must_change_password === true;

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-sidebar px-4 py-10">
      <div className="flex w-full max-w-[28rem] flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight">
            {forced ? "비밀번호를 변경해 주세요" : "비밀번호 변경"}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </header>

        {forced ? (
          <div className="flex items-start gap-3 rounded-lg bg-warn-soft px-4 py-3.5">
            <ShieldAlert
              className="mt-0.5 size-5 shrink-0 text-warn"
              aria-hidden
            />
            <div className="flex flex-col gap-1.5 text-sm leading-relaxed">
              <p className="font-medium">
                초기 비밀번호(admin123)는 매우 취약합니다.
              </p>
              <p className="text-muted-foreground">
                환자 개인정보를 입력하기 전에 반드시 변경해야 합니다. 변경하기
                전까지는 다른 화면을 사용할 수 없습니다.
              </p>
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-7">
          <ChangePasswordForm forced={forced} />
        </div>

        {forced ? null : (
          <Link
            href="/patients"
            className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            환자 목록으로
          </Link>
        )}
      </div>
    </main>
  );
}
