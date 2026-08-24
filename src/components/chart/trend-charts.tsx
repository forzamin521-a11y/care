"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SCALES, isHigherWorse, type ScaleCode } from "@/lib/scales";

export type TrendSeries = {
  code: ScaleCode;
  points: { date: string; value: number }[];
};

export type VitalSeries = {
  points: { date: string; weight: number | null; sbp: number | null }[];
};

/** 절단점 — 그래프에 기준선으로 그린다 */
const CUTOFF: Partial<Record<ScaleCode, { value: number; label: string }>> = {
  K_IADL: { value: 0.43, label: "기능장애 의심" },
  SGDS_K: { value: 8, label: "우울 의심" },
  K_MMSE: { value: 24, label: "정상 하한" },
  TUG: { value: 13.5, label: "낙상 위험" },
};

function shortDate(value: string) {
  return value.slice(2).replace(/-/g, ".");
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border px-4 py-3.5">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[0.95rem] font-medium">{title}</h3>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="h-[9rem] w-full">{children}</div>
    </div>
  );
}

const AXIS = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
};

export function TrendCharts({
  scales,
  vitals,
}: {
  scales: TrendSeries[];
  vitals: VitalSeries;
}) {
  const usableScales = scales.filter((s) => s.points.length >= 2);
  const weightPoints = vitals.points.filter((p) => p.weight !== null);
  const bpPoints = vitals.points.filter((p) => p.sbp !== null);

  const hasAnything =
    usableScales.length > 0 || weightPoints.length >= 2 || bpPoints.length >= 2;

  if (!hasAnything) {
    return (
      <p className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
        평가가 2회 이상 쌓이면 변화 추이가 그래프로 표시됩니다.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {usableScales.map((series) => {
        const def = SCALES[series.code];
        const cutoff = CUTOFF[series.code];
        const worseUp = isHigherWorse(series.code);

        return (
          <ChartCard
            key={series.code}
            title={def.name}
            subtitle={`${def.nameEn} · 점수 ↑ = ${worseUp ? "악화" : "호전"}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series.points.map((p) => ({
                  ...p,
                  label: shortDate(p.date),
                }))}
                margin={{ top: 6, right: 8, bottom: 0, left: -18 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis dataKey="label" tickLine={false} {...AXIS} />
                <YAxis
                  tickLine={false}
                  width={38}
                  domain={[
                    def.scoreRange.min,
                    def.kind === "numeric" ? "auto" : def.scoreRange.max,
                  ]}
                  {...AXIS}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                  formatter={(value) => [`${value}${def.unit}`, def.name]}
                />
                {cutoff ? (
                  <ReferenceLine
                    y={cutoff.value}
                    stroke="var(--warn)"
                    strokeDasharray="4 4"
                    label={{
                      value: cutoff.label,
                      position: "insideTopRight",
                      fill: "var(--warn)",
                      fontSize: 10,
                    }}
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      })}

      {weightPoints.length >= 2 ? (
        <ChartCard title="체중" subtitle="kg · 급격한 감소는 영양 확인">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weightPoints.map((p) => ({
                label: shortDate(p.date),
                value: p.weight,
              }))}
              margin={{ top: 6, right: 8, bottom: 0, left: -18 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="label" tickLine={false} {...AXIS} />
              <YAxis tickLine={false} width={38} domain={["auto", "auto"]} {...AXIS} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--popover-foreground)",
                }}
                formatter={(value) => [`${value}kg`, "체중"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-2)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {bpPoints.length >= 2 ? (
        <ChartCard title="수축기 혈압" subtitle="mmHg · 180 이상 주의">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={bpPoints.map((p) => ({
                label: shortDate(p.date),
                value: p.sbp,
              }))}
              margin={{ top: 6, right: 8, bottom: 0, left: -18 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="label" tickLine={false} {...AXIS} />
              <YAxis tickLine={false} width={38} domain={["auto", "auto"]} {...AXIS} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--popover-foreground)",
                }}
                formatter={(value) => [`${value} mmHg`, "수축기 혈압"]}
              />
              <ReferenceLine
                y={180}
                stroke="var(--danger)"
                strokeDasharray="4 4"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-3)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}
    </div>
  );
}
