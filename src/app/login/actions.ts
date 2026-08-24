"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export type LoginState = { error?: string };

/** 외부 주소로 튕겨나가지 않도록 next 파라미터를 검사한다 */
function safeNext(value: string): string | null {
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력하세요." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    // 원인은 서버 로그에 남긴다 — 화면에는 필요한 만큼만 보여준다
    console.error("[login] 실패:", error?.status, error?.code, error?.message);

    // 요청 제한·서버 장애는 자격 증명 문제와 구분해서 알려야 한다.
    // 그렇지 않으면 "비밀번호가 틀렸나?" 하고 계속 시도하게 된다.
    if (error?.status === 429 || error?.code === "over_request_rate_limit") {
      return {
        error:
          "로그인 시도가 많아 잠시 제한되었습니다. 1~2분 후 다시 시도하세요.",
      };
    }

    if (error && error.status && error.status >= 500) {
      return {
        error: "서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도하세요.",
      };
    }

    // 어떤 쪽이 틀렸는지는 알려주지 않는다 (계정 존재 여부 노출 방지)
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  await logAudit({
    action: "login",
    actorId: data.user.id,
    actorName: (data.user.user_metadata?.name as string | undefined) ?? null,
  });

  const mustChange = data.user.user_metadata?.must_change_password === true;

  redirect(mustChange ? "/change-password" : (next ?? "/patients"));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  await logAudit({ action: "logout" });
  await supabase.auth.signOut();

  redirect("/login");
}
