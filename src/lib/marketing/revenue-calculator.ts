import type { Locale } from "@/lib/i18n/types";

type RevenueEstimateInput = {
  averageServicePrice: number;
  lostSpotsPerWeek: number;
  recoveryRate: number;
};

type SliderPercentInput = {
  value: number;
  min: number;
  max: number;
};

type SliderValueFromClientXInput = {
  clientX: number;
  fallbackValue: number;
  max: number;
  min: number;
  step: number;
  trackLeft: number;
  trackWidth: number;
};

export function calculateRevenueEstimate({
  averageServicePrice,
  lostSpotsPerWeek,
  recoveryRate
}: RevenueEstimateInput) {
  const monthlyRevenueAtRisk = averageServicePrice * lostSpotsPerWeek * 4;
  const recoveredRevenue = Math.round(monthlyRevenueAtRisk * (recoveryRate / 100));

  return {
    monthlyRevenueAtRisk,
    recoveredRevenue
  };
}

export function formatRevenueAmount(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    currency: "CAD",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Math.round(value)).replace(/[\u00a0\u202f]/g, " ");
}

export function sliderPercent({ max, min, value }: SliderPercentInput) {
  if (max <= min) {
    return 0;
  }

  const percent = ((value - min) / (max - min)) * 100;

  return Math.min(100, Math.max(0, Math.round(percent * 100) / 100));
}

export function sliderValueFromClientX({
  clientX,
  fallbackValue,
  max,
  min,
  step,
  trackLeft,
  trackWidth
}: SliderValueFromClientXInput) {
  if (trackWidth <= 0 || max <= min || step <= 0) {
    return fallbackValue;
  }

  const rawPercent = (clientX - trackLeft) / trackWidth;
  const clampedPercent = Math.min(1, Math.max(0, rawPercent));
  const rawValue = min + clampedPercent * (max - min);
  const steppedValue = min + Math.round((rawValue - min) / step) * step;

  return Math.min(max, Math.max(min, Number(steppedValue.toFixed(5))));
}
