/**
 * 비밀번호 정책
 *
 * 최소 10자 + (영문 / 숫자 / 기호) 중 2종 이상 + 흔한 비밀번호 차단.
 * 비밀번호 자체는 Supabase Auth 가 bcrypt 로 해시해 저장하므로
 * 이 파일은 "쓸 수 있는 비밀번호인지"만 판단한다.
 */

export const PASSWORD_MIN_LENGTH = 10;

/** 사전 공격에 바로 뚫리는 값들 — 초기 비밀번호 admin123 포함 */
const BLOCKLIST = new Set([
  "admin123",
  "admin1234",
  "admin12345",
  "administrator",
  "password",
  "password1",
  "password123",
  "passw0rd",
  "qwerty123",
  "qwertyuiop",
  "1q2w3e4r",
  "1q2w3e4r5t",
  "caredoc123",
  "caredoc1234",
  "12345678",
  "123456789",
  "1234567890",
  "abcd1234",
  "asdf1234",
  "iloveyou",
  "welcome1",
  "letmein123",
]);

export type PasswordCheck = {
  ok: boolean;
  /** 사용자에게 보여줄 문제 목록 */
  errors: string[];
};

function charClasses(value: string): number {
  let count = 0;
  if (/[A-Za-z]/.test(value)) count += 1;
  if (/[0-9]/.test(value)) count += 1;
  if (/[^A-Za-z0-9]/.test(value)) count += 1;
  return count;
}

export function checkPassword(
  password: string,
  options: { currentPassword?: string; email?: string } = {}
): PasswordCheck {
  const errors: string[] = [];
  const normalized = password.trim();

  if (normalized.length < PASSWORD_MIN_LENGTH) {
    errors.push(`${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`);
  }

  if (charClasses(normalized) < 2) {
    errors.push("영문 · 숫자 · 기호 중 2종류 이상을 섞어야 합니다.");
  }

  const lower = normalized.toLowerCase();

  if (BLOCKLIST.has(lower)) {
    errors.push("너무 흔한 비밀번호입니다. 다른 값을 사용하세요.");
  }

  if (/^(.)\1+$/.test(normalized)) {
    errors.push("같은 문자만 반복할 수 없습니다.");
  }

  if (options.currentPassword && normalized === options.currentPassword) {
    errors.push("현재 비밀번호와 다른 값으로 정하세요.");
  }

  if (options.email) {
    const localPart = options.email.split("@")[0]?.toLowerCase();
    if (localPart && localPart.length >= 4 && lower.includes(localPart)) {
      errors.push("이메일 아이디를 그대로 포함할 수 없습니다.");
    }
  }

  return { ok: errors.length === 0, errors };
}

/** 화면에 안내로 띄우는 규칙 문구 */
export const PASSWORD_RULES = [
  `${PASSWORD_MIN_LENGTH}자 이상`,
  "영문 · 숫자 · 기호 중 2종류 이상",
  "흔한 비밀번호(admin123 등)는 사용 불가",
] as const;
