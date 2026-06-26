import { headers } from "next/headers";

import {
  loadCustomersWithConsent,
  loadWaitlistView
} from "@/lib/dashboard/operations-data";
import { buildGrowthSeries } from "@/lib/clients/growth-series";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { getPublicAppOrigin } from "@/lib/url/public-origin";
import { buildPublicWaitlistUrl } from "@/lib/waitlist/links";

export type ClientsInsightsData = {
  overview: {
    totalEnrolled: number;
    activeOptIn: number;
    newThisWeek: number;
    newThisWeekTrendPercent: number | null;
    unsubscribes: number;
    unsubscribesTrendPercent: number | null;
  };
  consentBreakdown: {
    optedIn: number;
    pending: number;
    optedOut: number;
    total: number;
  };
  growthSeries: Array<{
    dateKey: string;
    label: string;
    fullLabel: string;
    count: number;
  }>;
  enrollmentTimestamps: string[];
  publicLink: {
    ready: boolean;
    publicUrl: string | null;
    qrUrl: string | null;
    blockingReasons: string[];
  };
  timezone: string;
  lastUpdatedAt: string;
};

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function loadClientsInsightsData(): Promise<ClientsInsightsData | null> {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    return null;
  }

  const [customers, waitlistView, requestHeaders] = await Promise.all([
    loadCustomersWithConsent(),
    loadWaitlistView(),
    headers()
  ]);

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const newThisWeek = customers.filter(
    (customer) => new Date(customer.created_at) >= weekAgo
  ).length;
  const newPreviousWeek = customers.filter((customer) => {
    const created = new Date(customer.created_at);
    return created >= twoWeeksAgo && created < weekAgo;
  }).length;

  const unsubscribes = customers.filter(
    (customer) => customer.consentStatus === "opted_out"
  ).length;
  const unsubscribesThisWeek = customers.filter((customer) => {
    return (
      customer.consentStatus === "opted_out" &&
      new Date(customer.updated_at) >= weekAgo
    );
  }).length;
  const unsubscribesPreviousWeek = customers.filter((customer) => {
    const updated = new Date(customer.updated_at);
    return (
      customer.consentStatus === "opted_out" &&
      updated >= twoWeeksAgo &&
      updated < weekAgo
    );
  }).length;

  const optedIn = customers.filter(
    (customer) => customer.consentStatus === "opted_in"
  ).length;
  const pending = customers.filter(
    (customer) =>
      customer.consentStatus === "needs_consent" ||
      customer.consentStatus === "missing"
  ).length;
  const optedOut = unsubscribes;

  const enrollmentTimestamps = [
    ...customers.map((customer) => customer.created_at),
    ...waitlistView.entries.map((entry) => entry.created_at)
  ];

  const publicOrigin = getPublicAppOrigin({ requestHeaders });
  const slug = workspace.organization.slug;
  const publicUrl = publicOrigin.origin
    ? buildPublicWaitlistUrl({ baseUrl: publicOrigin.origin, slug })
    : null;
  const qrUrl = publicOrigin.origin
    ? buildPublicWaitlistUrl({
        baseUrl: publicOrigin.origin,
        slug,
        source: "qr_code"
      })
    : null;

  return {
    overview: {
      totalEnrolled: waitlistView.entries.length,
      activeOptIn: optedIn,
      newThisWeek,
      newThisWeekTrendPercent: percentChange(newThisWeek, newPreviousWeek),
      unsubscribes: optedOut,
      unsubscribesTrendPercent: percentChange(
        unsubscribesThisWeek,
        unsubscribesPreviousWeek
      )
    },
    consentBreakdown: {
      optedIn,
      pending,
      optedOut,
      total: customers.length
    },
    growthSeries: buildGrowthSeries(enrollmentTimestamps),
    enrollmentTimestamps,
    publicLink: {
      ready: Boolean(publicOrigin.isReady && publicUrl && qrUrl),
      publicUrl,
      qrUrl,
      blockingReasons: publicOrigin.blockingReasons
    },
    timezone: workspace.organization.timezone,
    lastUpdatedAt: now.toISOString()
  };
}
