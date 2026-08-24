/**
 * 읽기 전용 점검 — 아무것도 바꾸지 않는다.
 *  1. 테이블이 만들어졌는지
 *  2. 관리자 계정이 있는지
 *  3. anon 키로는 환자 정보가 안 읽히는지 (RLS 확인)
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TABLES = [
  "profiles",
  "patients",
  "assessments",
  "assessment_revisions",
  "scale_results",
  "problems",
  "management_plans",
  "medications",
  "labs",
  "audit_logs",
];

async function main() {
  console.log(`\n[1] 테이블 확인 (${new URL(url).hostname})`);
  let missing = 0;

  for (const table of TABLES) {
    const { error, count } = await admin
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) {
      missing += 1;
      console.log(`  ✖ ${table.padEnd(22)} ${error.message}`);
    } else {
      console.log(`  ✔ ${table.padEnd(22)} ${count ?? 0}건`);
    }
  }

  console.log("\n[2] 관리자 계정 확인");
  const { data: users, error: userError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 100,
  });

  if (userError) {
    console.log(`  ✖ ${userError.message}`);
  } else if (users.users.length === 0) {
    console.log("  ⚠ 계정이 없습니다 → npm run seed:admin 을 실행하세요.");
  } else {
    for (const u of users.users) {
      const must = u.user_metadata?.must_change_password === true;
      console.log(
        `  ✔ ${u.email}  ${must ? "(최초 비밀번호 변경 필요)" : "(비밀번호 변경 완료)"}`
      );
    }
  }

  console.log("\n[3] RLS 확인 — anon 키로 환자 조회 시도");
  const { data: leak, error: rlsError } = await anon
    .from("patients")
    .select("id, name")
    .limit(1);

  if (rlsError) {
    console.log(`  ✔ 차단됨: ${rlsError.message}`);
  } else if (!leak || leak.length === 0) {
    console.log("  ✔ 차단됨: 아무 행도 반환되지 않음");
  } else {
    console.log(`  ✖ 위험! anon 키로 ${leak.length}건이 읽혔습니다.`);
  }

  console.log(
    missing === 0
      ? "\n결과: 스키마 정상\n"
      : `\n결과: 테이블 ${missing}개 누락 — 0001_init.sql 을 다시 실행하세요.\n`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
