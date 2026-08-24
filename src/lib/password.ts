/**
 * 비밀번호 정책
 *
 * 병원 요청으로 자체 제한(길이·문자종류·금칙어)을 두지 않는다.
 * 남은 제약은 Supabase Auth 가 서버에서 거는 최소 길이뿐이다(기본 6자).
 *
 * 비밀번호 자체는 Supabase 가 bcrypt 로 해시해 저장하므로
 * 이 파일은 "형식상 쓸 수 있는 값인지"만 본다.
 */

/** Supabase Auth 의 기본 최소 길이 — 우리가 정한 값이 아니라 서버가 거부하는 값 */
export const SUPABASE_MIN_LENGTH = 6;

export type PasswordCheck = {
  ok: boolean;
  errors: string[];
};

export function checkPassword(password: string): PasswordCheck {
  const errors: string[] = [];

  if (!password) {
    errors.push("새 비밀번호를 입력하세요.");
  }

  return { ok: errors.length === 0, errors };
}

/** 화면에 띄우는 안내 문구 */
export const PASSWORD_RULES = [
  `${SUPABASE_MIN_LENGTH}자 이상이면 됩니다`,
] as const;
