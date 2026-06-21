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
