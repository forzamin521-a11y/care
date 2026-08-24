import "server-only";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";

export type AuditAction =
  | "login"
  | "logout"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "print"
  | "password_change";

type AuditInput = {
  action: AuditAction;
  targetTable?: string;
  targetId?: string | null;
  detail?: Record<string, unknown>;
  /** 로그인 직후처럼 profiles 조회를 건너뛰고 싶을 때 직접 넘긴다 */
  actorId?: string | null;
  actorName?: string | null;
};

/** 프록시·로드밸런서를 거친 실제 클라이언트 IP */
async function clientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip");
}

/**
 * 감사 로그 기록.
 *
 * 기록 실패가 본래 작업을 막아서는 안 되므로 오류는 삼키고 콘솔에만 남긴다.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    let actorId = input.actorId ?? null;
    let actorName = input.actorName ?? null;

    if (!actorId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      actorId = user?.id ?? null;
      actorName =
        (user?.user_metadata?.name as string | undefined) ?? actorName;
    }

    const h = await headers();

    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      actor_name: actorName,
      action: input.action,
      target_table: input.targetTable ?? null,
      target_id: input.targetId ?? null,
      detail: input.detail ?? null,
      ip: await clientIp(),
      user_agent: h.get("user-agent"),
    });
  } catch (error) {
    console.error("[audit] 기록 실패:", error);
  }
}
