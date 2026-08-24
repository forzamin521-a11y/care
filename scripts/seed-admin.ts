/**
 * 최초 관리자 계정 생성 스크립트
 *
 *   npm run seed:admin
 *
 * 왜 SQL 시드가 아니라 스크립트인가
 *   Supabase Auth 의 Admin API 를 거치면 비밀번호가 bcrypt 로 해시되어
 *   저장된다. SQL 에 비밀번호를 적어 넣지 않으므로 저장소에도, 데이터베이스에도
 *   평문이 남지 않는다.
 *
 * 생성된 계정은 must_change_password = true 상태이므로
 * 최초 로그인 시 비밀번호 변경 화면을 반드시 거친다.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const name = process.env.ADMIN_NAME ?? "관리자";
const password = process.env.ADMIN_INITIAL_PASSWORD;

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!url) fail("NEXT_PUBLIC_SUPABASE_URL 이 .env.local 에 없습니다.");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY 가 .env.local 에 없습니다.");
if (!email) fail("ADMIN_EMAIL 이 .env.local 에 없습니다.");
if (!password) fail("ADMIN_INITIAL_PASSWORD 가 .env.local 에 없습니다.");

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`\n관리자 계정을 준비합니다: ${email}`);

  // 이미 있는 계정인지 확인
  const { data: list, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (listError) fail(`사용자 목록을 읽을 수 없습니다: ${listError.message}`);

  const existing = list.users.find(
    (u) => u.email?.toLowerCase() === email!.toLowerCase()
  );

  let userId: string;

  if (existing) {
    console.log("→ 이미 계정이 있습니다. 비밀번호를 초기값으로 재설정합니다.");

    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { name, must_change_password: true },
    });

    if (error) fail(`비밀번호 재설정 실패: ${error.message}`);
    userId = data.user.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 사내용이므로 메일 인증 절차를 생략
      user_metadata: { name, must_change_password: true },
    });

    if (error) fail(`계정 생성 실패: ${error.message}`);
    userId = data.user.id;
    console.log("→ 계정을 생성했습니다.");
  }

  // profiles 는 트리거가 자동 생성한다. 이름·플래그만 맞춘다.
  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        name,
        role: "admin",
        must_change_password: true,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    fail(
      `profiles 갱신 실패: ${profileError.message}\n` +
        "supabase/migrations/0001_init.sql 을 먼저 실행했는지 확인하세요."
    );
  }

  console.log(`
✔ 준비 완료

  로그인 주소   /login
  이메일        ${email}
  비밀번호      ${password}

  ⚠ 최초 로그인 시 비밀번호 변경 화면이 강제로 뜹니다.
    실제 환자 정보를 입력하기 전에 반드시 변경하세요.
`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
