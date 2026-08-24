"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkPassword, SUPABASE_MIN_LENGTH } from "@/lib/password";
import { logAudit } from "@/lib/audit";

export type ChangePasswordState = {
  errors?: string[];
  ok?: boolean;
};

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { errors: ["현재 비밀번호와 새 비밀번호를 입력하세요."] };
  }

  if (newPassword !== confirmPassword) {
    return { errors: ["새 비밀번호 확인이 일치하지 않습니다."] };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  // 형식 검사 (길이·문자종류 제한은 두지 않는다)
  const check = checkPassword(newPassword);

  if (!check.ok) {
    return { errors: check.errors };
  }

  // 현재 비밀번호 재확인 — 세션만 있으면 바꿀 수 있게 두면 안 된다
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reauthError) {
    console.error(
      "[change-password] 재확인 실패:",
      reauthError.status,
      reauthError.code,
      reauthError.message
    );

    if (reauthError.status === 429) {
      return {
        errors: ["요청이 많아 잠시 제한되었습니다. 1~2분 후 다시 시도하세요."],
      };
    }
    return { errors: ["현재 비밀번호가 올바르지 않습니다."] };
  }

  // 비밀번호 변경 + 강제 변경 플래그 해제
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
    data: { must_change_password: false },
  });

  if (updateError) {
    const m = updateError.message;
    const friendly = m.includes("should be different")
      ? "현재 비밀번호와 다른 값으로 정하세요."
      : /at least|too short|minimum/i.test(m)
        ? `비밀번호가 너무 짧습니다. ${SUPABASE_MIN_LENGTH}자 이상으로 정하세요.`
        : `변경에 실패했습니다: ${m}`;
    return { errors: [friendly] };
  }

  await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id);

  await logAudit({
    action: "password_change",
    targetTable: "profiles",
    targetId: user.id,
  });

  redirect("/patients?password_changed=1");
}
