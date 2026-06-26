"use client";

import { useMemo, useState } from "react";

import type { GrowthSeriesPoint } from "@/lib/clients/growth-series";
import {
  getGrowthChartXTickIndexes,
  getGrowthChartYScale
} from "@/lib/clients/growth-series";

type ChartPoint = GrowthSeriesPoint & {
  x: number;
  y: number;
};

const CHART = {
  width: 640,
  height: 280,
  paddingTop: 16,
  paddingRight: 20,
  paddingBottom: 36,
  paddingLeft: 44
};

function formatTickLabel(value: number) {
  return new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 0
  }).format(value);
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function buildAreaPath(
  points: Array<{ x: number; y: number }>,
  baselineY: number
) {
  if (points.length === 0) {
    return "";
  }

  const linePath = buildLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
}

function getNearestPointIndex(
  points: ChartPoint[],
  pointerX: number,
  plotLeft: number,
  plotWidth: number
) {
  if (points.length === 0) {
    return 0;
  }

  const ratio = Math.min(Math.max((pointerX - plotLeft) / plotWidth, 0), 1);
  const index = Math.round(ratio * (points.length - 1));
  return Math.min(Math.max(index, 0), points.length - 1);
}

export function ClientsGrowthChart({
  series
}: {
  series: GrowthSeriesPoint[];
}) {
  const [activeIndex, setActiveIndex] = useState(series.length - 1);

  const chart = useMemo(() => {
    const plotLeft = CHART.paddingLeft;
    const plotTop = CHART.paddingTop;
    const plotRight = CHART.width - CHART.paddingRight;
    const plotBottom = CHART.height - CHART.paddingBottom;
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;
    const dataMax = Math.max(...series.map((point) => point.count), 0);
    const yScale = getGrowthChartYScale(dataMax);

    const points: ChartPoint[] = series.map((point, index) => ({
      ...point,
      x: plotLeft + (index / Math.max(series.length - 1, 1)) * plotWidth,
      y: plotBottom - (point.count / yScale.max) * plotHeight
    }));

    return {
      plotBottom,
      plotLeft,
      plotRight,
      plotTop,
      plotWidth,
      yScale,
      yTicks: yScale.ticks,
      points,
      xTickIndexes: getGrowthChartXTickIndexes(series.length),
      linePath: buildLinePath(points),
      areaPath: buildAreaPath(points, plotBottom)
    };
  }, [series]);

  const activePoint = chart.points[activeIndex] ?? chart.points[chart.points.length - 1];

  function handlePointerMove(clientX: number, currentTarget: SVGSVGElement) {
    const bounds = currentTarget.getBoundingClientRect();
    const relativeX = ((clientX - bounds.left) / bounds.width) * CHART.width;
    setActiveIndex(
      getNearestPointIndex(chart.points, relativeX, chart.plotLeft, chart.plotWidth)
    );
  }

  return (
    <div className="relative w-full">
      <svg
        aria-label="Graphique de croissance de la liste d'attente"
        className="h-auto w-full touch-none select-none"
        onMouseLeave={() => setActiveIndex(series.length - 1)}
        onMouseMove={(event) => handlePointerMove(event.clientX, event.currentTarget)}
        onTouchMove={(event) => {
          const touch = event.touches[0];
          if (touch) {
            handlePointerMove(touch.clientX, event.currentTarget);
          }
        }}
        role="img"
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      >
        <defs>
          <linearGradient id="clients-growth-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2563ff" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="clients-growth-plot">
            <rect
              height={chart.plotBottom - chart.plotTop}
              width={chart.plotWidth}
              x={chart.plotLeft}
              y={chart.plotTop}
            />
          </clipPath>
        </defs>

        {chart.yTicks.map((tick) => {
          const y =
            chart.plotBottom -
            (tick / chart.yScale.max) * (chart.plotBottom - chart.plotTop);

          return (
            <g key={tick}>
              <line
                stroke="#e2e8f0"
                strokeDasharray="4 6"
                x1={chart.plotLeft}
                x2={chart.plotRight}
                y1={y}
                y2={y}
              />
              <text
                fill="#94a3b8"
                fontSize="11"
                textAnchor="end"
                x={chart.plotLeft - 10}
                y={y + 4}
              >
                {formatTickLabel(tick)}
              </text>
            </g>
          );
        })}

        <g clipPath="url(#clients-growth-plot)">
          <path d={chart.areaPath} fill="url(#clients-growth-area)" />
          <path
            d={chart.linePath}
            fill="none"
            stroke="#2563ff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />
        </g>

        {chart.xTickIndexes.map((index) => {
          const point = chart.points[index];
          if (!point) {
            return null;
          }

          return (
            <text
              fill="#94a3b8"
              fontSize="11"
              key={point.dateKey}
              textAnchor="middle"
              x={point.x}
              y={CHART.height - 10}
            >
              {point.label}
            </text>
          );
        })}

        {activePoint ? (
          <>
            <line
              stroke="#cbd5e1"
              strokeDasharray="4 4"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={chart.plotTop}
              y2={chart.plotBottom}
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              fill="#2563ff"
              r="5"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </>
        ) : null}
      </svg>

      {activePoint ? (
        <div
          className="pointer-events-none absolute z-10 min-w-[9rem] rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
          style={{
            left: `${(activePoint.x / CHART.width) * 100}%`,
            top: `${(activePoint.y / CHART.height) * 100}%`,
            transform: "translate(-50%, calc(-100% - 14px))"
          }}
        >
          <p className="text-xs text-[#64748b]">{activePoint.fullLabel}</p>
          <p className="mt-0.5 text-sm text-[#07142f]">
            <span className="font-black">{activePoint.count}</span> inscrits
          </p>
        </div>
      ) : null}
    </div>
  );
}
