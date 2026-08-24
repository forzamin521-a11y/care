import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, ScrollText } from "lucide-react";
import {
  createSupabaseServerClient,
  getCurrentProfile,
} from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "설정" };

const ACTION_LABEL: Record<string, string> = {
  login: "로그인",
  logout: "로그아웃",
  view: "조회",
  create: "등록",
  update: "수정",
  delete: "삭제",
  print: "인쇄",
  password_change: "비밀번호 변경",
};

type AuditRow = {
  id: number;
  actor_name: string | null;
  action: string;
  target_table: string | null;
  at: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function SettingsPage() {
  const current = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();

  const { data: logRows } = await supabase
    .from("audit_logs")
    .select("id, actor_name, action, target_table, at")
    .order("at", { ascending: false })
    .limit(30);

  const logs = (logRows ?? []) as AuditRow[];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">설정</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정</CardTitle>
          <CardDescription>
            비밀번호는 Supabase 가 해시하여 저장합니다. 평문으로 보관되지 않습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end justify-between gap-4">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-20 text-muted-foreground">이름</dt>
              <dd>{current?.profile?.name ?? "-"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 text-muted-foreground">이메일</dt>
              <dd className="font-mono text-[0.85rem]">
                {current?.user.email ?? "-"}
              </dd>
            </div>
          </dl>

          <Button asChild variant="outline" className="h-11 gap-1.5 px-4">
            <Link href="/change-password">
              <KeyRound className="size-4" aria-hidden />
              비밀번호 변경
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="size-4 text-muted-foreground" aria-hidden />
            감사 로그
          </CardTitle>
          <CardDescription>
            누가 언제 무엇을 했는지 기록됩니다. 최근 30건.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              기록이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[11rem]">시각</TableHead>
                    <TableHead className="w-[8rem]">사용자</TableHead>
                    <TableHead className="w-[8rem]">동작</TableHead>
                    <TableHead>대상</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDateTime(log.at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.actor_name ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ACTION_LABEL[log.action] ?? log.action}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.target_table ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
