import Link from "next/link";
import { ClipboardList, Users, Settings, LogOut, Printer } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { IdleLogout } from "@/components/idle-logout";

const NAV = [
  { href: "/patients", label: "환자 목록", icon: Users },
  { href: "/forms", label: "설문지 인쇄", icon: Printer },
  { href: "/settings", label: "설정", icon: Settings },
];

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header
        data-app-nav
        className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      >
        <div className="mx-auto flex h-16 w-full max-w-[85rem] items-center gap-4 px-4 sm:px-6">
          <Link
            href="/patients"
            className="flex items-center gap-2.5 rounded-md focus-visible:ring-ring/60 focus-visible:outline-none focus-visible:ring-2"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardList className="size-5" aria-hidden />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[0.95rem] font-semibold tracking-tight">
                케어닥 포괄평가기록
              </span>
              <span className="text-xs text-muted-foreground">
                입소자 포괄적 평가
              </span>
            </span>
          </Link>

          <nav className="ml-2 flex items-center gap-1">
            {NAV.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className="h-10 gap-1.5 px-3 text-[0.95rem]"
              >
                <Link href={item.href}>
                  <item.icon className="size-4" aria-hidden />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {userName}
            </span>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                className="h-10 gap-1.5 px-3 text-[0.95rem]"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">로그아웃</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[85rem] flex-1 px-4 py-7 sm:px-6">
        {children}
      </main>

      <IdleLogout />
    </div>
  );
}
