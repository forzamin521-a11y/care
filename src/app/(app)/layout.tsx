import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // proxy.ts 에서 낙관적으로 걸러내지만, 실제 확인은 여기서 다시 한다
  const current = await getCurrentProfile();

  if (!current) redirect("/login");
  if (current.user.user_metadata?.must_change_password === true) {
    redirect("/change-password");
  }

  const userName =
    current.profile?.name ??
    (current.user.user_metadata?.name as string | undefined) ??
    "관리자";

  return <AppShell userName={userName}>{children}</AppShell>;
}
