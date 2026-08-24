import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버(Server Component / Server Action)용 Supabase 클라이언트.
 *
 * Next.js 16 부터 cookies() 는 async 이므로 반드시 await 한다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component 에서는 쿠키를 쓸 수 없다.
            // 세션 갱신은 proxy.ts 가 담당하므로 여기서는 무시해도 안전하다.
          }
        },
      },
    }
  );
}

/** 로그인한 사용자를 가져온다. 없으면 null */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** 로그인한 사용자 + profiles 레코드를 함께 가져온다 */
export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, must_change_password")
    .eq("id", user.id)
    .single();

  return { user, profile };
}
