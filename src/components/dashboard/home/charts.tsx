"use client";

import { cn } from "@/lib/utils/cn";

export type SparklineTone =
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "red"
  | "amber";

const toneColors: Record<SparklineTone, { stroke: string; fill: string }> = {
  blue: { stroke: "#2563ff", fill: "rgba(37, 99, 255, 0.12)" },
  green: { stroke: "#16a34a", fill: "rgba(22, 163, 74, 0.12)" },
  orange: { stroke: "#f97316", fill: "rgba(249, 115, 22, 0.12)" },
  violet: { stroke: "#7c3aed", fill: "rgba(124, 58, 237, 0.12)" },
  red: { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.12)" },
  amber: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.12)" }
};

function buildPath(data: number[], width: number, height: number) {
  if (data.length === 0) {
    return `M 0 ${height / 2} L ${width} ${height / 2}`;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = Math.max(max - min, 1);
  const step = data.length <= 1 ? width : width / (data.length - 1);

  return data
    .map((value, index) => {
      const x = index * step;
      const normalized = (value - min) / range;
      const y = height - normalized * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(data: number[], width: number, height: number) {
  if (data.length === 0) {
    return `M 0 ${height} L ${width} ${height} Z`;
  }

  const linePath = buildPath(data, width, height);
  const step = data.length <= 1 ? width : width / (data.length - 1);
  const lastX = (data.length - 1) * step;
  return `${linePath} L ${lastX.toFixed(2)} ${height} L 0 ${height} Z`;
}

export function Sparkline({
  data,
  tone = "blue",
  className,
  ariaLabel
}: {
  data: number[];
  tone?: SparklineTone;
  className?: string;
  ariaLabel?: string;
}) {
  const width = 280;
  const height = 48;
  const colors = toneColors[tone];
  const normalizedData =
    data.length > 0 && data.every((value) => value === 0)
      ? data.map(() => 0)
      : data;

  return (
    <svg
      aria-label={ariaLabel}
      className={cn("h-12 w-full", className)}
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <path d={buildAreaPath(normalizedData, width, height)} fill={colors.fill} />
      <path
        d={buildPath(normalizedData, width, height)}
        fill="none"
        stroke={colors.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function LineChart({
  labels,
  series,
  className
}: {
  labels: string[];
  series: Array<{ name: string; data: number[]; tone: SparklineTone; dashed?: boolean }>;
  className?: string;
}) {
  const width = 640;
  const height = 260;
  const padding = { top: 16, right: 16, bottom: 36, left: 36 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const allValues = series.flatMap((item) => item.data);
  const maxValue = Math.max(...allValues, 1);
  const yTicks = [0, Math.round(maxValue / 2), maxValue];

  function pointAt(value: number, index: number, length: number) {
    const x =
      length <= 1
        ? padding.left + chartWidth / 2
        : padding.left + (index / (length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  }

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap gap-4">
        {series.map((item) => (
          <div className="flex items-center gap-2 text-sm text-[#64748b]" key={item.name}>
            <span
              className="inline-block h-0.5 w-5 rounded-full"
              style={{
                backgroundColor: toneColors[item.tone].stroke,
                borderBottom: item.dashed ? `2px dashed ${toneColors[item.tone].stroke}` : undefined
              }}
            />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
      <svg
        aria-label="Activity overview chart"
        className="w-full"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {yTicks.map((tick) => {
          const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={tick}>
              <line
                stroke="#e2eaf5"
                strokeDasharray="4 4"
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
              />
              <text
                fill="#94a3b8"
                fontSize="11"
                textAnchor="end"
                x={padding.left - 8}
                y={y + 4}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {series.map((item) => {
          const points = item.data.map((value, index) =>
            pointAt(value, index, item.data.length)
          );
          const path = points
            .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
            .join(" ");

          return (
            <path
              d={path}
              fill="none"
              key={item.name}
              stroke={toneColors[item.tone].stroke}
              strokeDasharray={item.dashed ? "6 6" : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          );
        })}

        {labels.map((label, index) => {
          const x =
            labels.length <= 1
              ? padding.left + chartWidth / 2
              : padding.left + (index / Math.max(labels.length - 1, 1)) * chartWidth;

          return (
            <text
              fill="#94a3b8"
              fontSize="11"
              key={`${label}-${index}`}
              textAnchor="middle"
              x={x}
              y={height - 8}
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
