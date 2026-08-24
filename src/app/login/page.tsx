import type { Metadata } from "next";
import { ClipboardList } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const raw = params.next;
  const next = typeof raw === "string" ? raw : "";

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-sidebar px-4 py-10">
      <div className="flex w-full max-w-[26rem] flex-col gap-7">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ClipboardList className="size-6" aria-hidden />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">
              케어닥 포괄평가기록
            </h1>
            <p className="text-sm text-muted-foreground">
              요양병원 입소자 포괄평가기록부 작성 · 이력관리
            </p>
          </div>
        </header>

        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-7">
          <LoginForm next={next} />
        </div>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          환자 개인정보를 다루는 시스템입니다.
          <br />
          공용 PC 에서는 사용 후 반드시 로그아웃하세요.
        </p>
      </div>
    </main>
  );
}
