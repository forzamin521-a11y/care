import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 인증 가드 (Next.js 16 부터 middleware → proxy).
 *
 * 하는 일
 *   1. Supabase 세션 쿠키 갱신
 *   2. 로그인하지 않았으면 /login 으로
 *   3. 최초 비밀번호를 아직 바꾸지 않았으면 /change-password 로 (다른 화면 차단)
 *
 * 여기서 하는 판단은 "낙관적 검사"다. 실제 권한 확인은 각 페이지·서버 액션에서
 * 다시 하고, 데이터 접근은 RLS 가 최종적으로 막는다.
 */

/** 로그인하지 않아도 열리는 경로 */
const PUBLIC_PATHS = ["/login", "/auth"];

/** 비밀번호 변경 전에도 열려 있어야 하는 경로 */
const PASSWORD_CHANGE_ALLOWED = ["/change-password", "/logout", "/auth"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() 를 호출해야 만료된 세션이 갱신된다
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = startsWithAny(pathname, PUBLIC_PATHS);

  // 1) 로그인 안 됨 → /login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (user) {
    // JWT 안에 담아두어 매 요청마다 DB 를 조회하지 않는다
    const mustChange = user.user_metadata?.must_change_password === true;

    // 2) 비밀번호 변경 전에는 다른 화면 차단
    if (mustChange && !startsWithAny(pathname, PASSWORD_CHANGE_ALLOWED)) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // 3) 이미 로그인한 사람이 /login 으로 오면 되돌린다
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = mustChange ? "/change-password" : "/patients";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 정적 파일과 이미지 최적화 요청은 건너뛴다.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
