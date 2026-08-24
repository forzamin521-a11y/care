"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

/**
 * 자리 비움 자동 로그아웃.
 *
 * 병동 공용 PC 를 켜둔 채 자리를 뜨는 경우를 대비한다.
 * 30분간 아무 조작이 없으면 로그아웃하고, 1분 전에 안내를 띄운다.
 */

const IDLE_MS = 30 * 60 * 1000; // 30분
const WARN_MS = 60 * 1000; // 만료 1분 전 경고
const TICK_MS = 5 * 1000; // 5초마다 확인

const ACTIVITY_EVENTS = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "focus",
] as const;

export function IdleLogout() {
  // 마지막 조작 시각은 ref 로만 갱신한다 (마우스 움직일 때마다 렌더하지 않도록).
  // 렌더 중에는 Date.now() 를 부를 수 없으므로 마운트 후 effect 에서 채운다.
  const lastActiveRef = useRef(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const markActive = useCallback(() => {
    lastActiveRef.current = Date.now();
  }, []);

  const stayLoggedIn = () => {
    markActive();
    setSecondsLeft(null);
  };

  useEffect(() => {
    lastActiveRef.current = Date.now();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true });
    }
    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActive);
      }
    };
  }, [markActive]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (lastActiveRef.current === 0) return; // 아직 초기화 전
      const idle = Date.now() - lastActiveRef.current;
      const remaining = IDLE_MS - idle;

      if (remaining <= 0) {
        window.clearInterval(timer);
        void logoutAction();
        return;
      }

      setSecondsLeft(
        remaining <= WARN_MS ? Math.ceil(remaining / 1000) : null
      );
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, []);

  if (secondsLeft === null) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="no-print fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4"
    >
      <div className="flex w-full max-w-md flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-lg">
        <Clock className="size-5 shrink-0 text-warn" aria-hidden />
        <p className="flex-1 text-sm leading-relaxed">
          자리를 비우신 것 같습니다.
          <br />
          <strong className="tabular-nums">{secondsLeft}초</strong> 후 자동으로
          로그아웃됩니다.
        </p>
        <Button type="button" onClick={stayLoggedIn} className="h-10 px-4">
          계속 사용
        </Button>
      </div>
    </div>
  );
}
