"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저용 Supabase 클라이언트.
 *
 * 여기서 쓰는 anon 키는 브라우저에 그대로 노출된다.
 * 그래서 모든 테이블에 RLS 를 켜 두었다 — 로그인하지 않으면 아무것도 읽히지 않는다.
 * service_role 키는 절대 이 파일에서 쓰지 않는다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
