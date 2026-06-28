"use client";

import type { AdminSmsDiagnosticRow } from "@/lib/admin/sms-diagnostics";
import type { SmsActivityMetrics, SmsRecentEvents } from "@/lib/sms/configuration-data";
import { mapSmsMessageSource } from "@/components/sms/sms-shared";
import {
  SmsArrowInIcon,
  SmsArrowOutIcon,
  SmsBellIcon,
  SmsChartIcon
} from "@/components/admin/sms-configuration-icons";
import {
  formatCount,
  formatPercent,
  formatSmsDate,
  formatSmsShortTime,
  formatTrendPercent,
  rowStatusLabel,
  smsPageStyles
} from "@/components/sms/sms-shared";
import {
  SmsBadge,
  SmsCard,
  SmsCardHeader,
  SmsEmptyState,
  SmsFooterLink,
  SmsIconPill
} from "@/components/sms/sms-ui";
import { useMemo, useState } from "react";

function exportJournalCsv(rows: AdminSmsDiagnosticRow[]) {
  const header = [
    "Date",
    "Direction",
    "Statut",
    "Client",
    "Numéro",
    "Message",
    "Source"
  ];
  const lines = rows.map((row) =>
    [
      row.createdAt,
      row.direction === "outbound" ? "Sortant" : "Entrant",
      rowStatusLabel(row),
      row.customerName ?? "",
      row.phoneMasked,
      row.bodyPreview,
      mapSmsMessageSource(row.context)
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );

  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "journal-sms.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function KpiCard({
  icon,
  label,
  value,
  trend,
  trendPositive
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string | null;
  trendPositive?: boolean | null;
}) {
  return (
    <SmsCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <SmsIconPill className="h-9 w-9">{icon}</SmsIconPill>
      </div>
      <p className="mt-4 text-sm font-bold text-[#64748b]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-[#0b1328]">{value}</p>
      {trend ? (
        <p
          className={`mt-2 text-xs font-bold ${
            trendPositive === false
              ? "text-red-600"
              : trendPositive === true
                ? "text-[#16a34a]"
                : "text-[#64748b]"
          }`}
        >
          {trend}
        </p>
      ) : null}
    </SmsCard>
  );
}

export function SmsActivityTab({
  metrics,
  rows,
  events,
  baseHref,
  filters
}: {
  metrics: SmsActivityMetrics;
  rows: AdminSmsDiagnosticRow[];
  events: SmsRecentEvents;
  baseHref: string;
  filters: {
    q: string;
    status: string;
    direction: string;
    from: string;
    to: string;
    page: number;
  };
}) {
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState(filters.q);
  const [status, setStatus] = useState(filters.status);
  const [direction, setDirection] = useState(filters.direction);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch =
        !search ||
        [row.customerName, row.phoneMasked, row.bodyPreview, row.organizationName]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus = status === "all" || row.status === status;
      const matchesDirection =
        direction === "all" || row.direction === direction;

      return matchesSearch && matchesStatus && matchesDirection;
    });
  }, [rows, search, status, direction]);

  const total = filteredRows.length;
  const currentPage = Math.max(1, filters.page);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const outboundTrend = formatTrendPercent(metrics.outboundChangePercent);
  const deliveryTrend =
    metrics.deliveryRateChangePoints !== null
      ? `${metrics.deliveryRateChangePoints >= 0 ? "+" : ""}${metrics.deliveryRateChangePoints
          .toFixed(1)
          .replace(".", ",")} %`
      : null;

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<SmsChartIcon className="h-4 w-4" />}
          label="SMS envoyés"
          trend={
            outboundTrend
              ? `${outboundTrend} vs la période précédente`
              : undefined
          }
          trendPositive={(metrics.outboundChangePercent ?? 0) >= 0}
          value={formatCount(metrics.outboundCount)}
        />
        <KpiCard
          icon={<SmsChartIcon className="h-4 w-4" />}
          label="Taux de livraison"
          trend={
            deliveryTrend ? `${deliveryTrend} vs la période précédente` : undefined
          }
          trendPositive={(metrics.deliveryRateChangePoints ?? 0) >= 0}
          value={formatPercent(metrics.deliveryRate)}
        />
        <KpiCard
          icon={<SmsBellIcon className="h-4 w-4" />}
          label="Réponses STOP"
          trend={
            metrics.stopReplyChange !== null
              ? `${metrics.stopReplyChange >= 0 ? "+" : ""}${metrics.stopReplyChange} vs la période précédente`
              : undefined
          }
          trendPositive={false}
          value={formatCount(metrics.stopReplyCount)}
        />
        <KpiCard
          icon={<SmsChartIcon className="h-4 w-4" />}
          label="Dernière synchronisation"
          trend={metrics.isSynced ? "Synchronisé" : undefined}
          trendPositive={metrics.isSynced}
          value={formatSmsDate(metrics.lastSyncAt)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <SmsCard>
          <SmsCardHeader icon={<SmsChartIcon className="h-5 w-5" />} title="Journal SMS" />

          <form className="mt-5 grid gap-3 lg:grid-cols-4" method="get">
            <input name="tab" type="hidden" value="activity" />
            <label className="grid gap-2 lg:col-span-2">
              <span className={smsPageStyles.label}>Recherche</span>
              <input
                className={smsPageStyles.input}
                name="q"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par client, numéro, message..."
                value={search}
              />
            </label>
            <label className="grid gap-2">
              <span className={smsPageStyles.label}>Statut</span>
              <select
                className={smsPageStyles.input}
                name="status"
                onChange={(event) => setStatus(event.target.value)}
                value={status}
              >
                <option value="all">Tous</option>
                <option value="delivered">Livré</option>
                <option value="received">Reçu</option>
                <option value="failed">Échec</option>
                <option value="sent">Envoyé</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className={smsPageStyles.label}>Type</span>
              <select
                className={smsPageStyles.input}
                name="direction"
                onChange={(event) => setDirection(event.target.value)}
                value={direction}
              >
                <option value="all">Tous</option>
                <option value="outbound">Sortant</option>
                <option value="inbound">Entrant</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <button className={smsPageStyles.secondaryButton} type="submit">
                Filtrer
              </button>
              <button
                className={smsPageStyles.secondaryButton}
                onClick={() => exportJournalCsv(filteredRows)}
                type="button"
              >
                Exporter
              </button>
            </div>
          </form>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e1e9f5] text-xs uppercase tracking-wide text-[#64748b]">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Direction</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Numéro</th>
                  <th className="px-3 py-3">Aperçu du message</th>
                  <th className="px-3 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr className="border-b border-[#e1e9f5]" key={row.id}>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatSmsDate(row.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2">
                        {row.direction === "outbound" ? (
                          <SmsArrowOutIcon className="h-4 w-4 text-[#16a34a]" />
                        ) : (
                          <SmsArrowInIcon className="h-4 w-4 text-[#2563ff]" />
                        )}
                        {row.direction === "outbound" ? "Sortant" : "Entrant"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <SmsBadge label={rowStatusLabel(row)} />
                    </td>
                    <td className="px-3 py-3">{row.customerName ?? "—"}</td>
                    <td className="px-3 py-3 font-mono text-xs">{row.phoneMasked}</td>
                    <td className="max-w-xs px-3 py-3 truncate">{row.bodyPreview}</td>
                    <td className="px-3 py-3">{mapSmsMessageSource(row.context)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pageRows.length === 0 ? (
              <div className="mt-4">
                <SmsEmptyState
                  description="Ajustez les filtres ou attendez de nouveaux messages."
                  title="Aucun message"
                />
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#64748b]">
            <p>
              Affichage {total === 0 ? 0 : start + 1} à {Math.min(start + pageSize, total)} de{" "}
              {total} résultats
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <a
                    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 font-bold ${
                      pageNumber === currentPage
                        ? "border-[#2563ff] bg-[#2563ff] text-white"
                        : "border-[#e1e9f5] bg-white text-[#64748b]"
                    }`}
                    href={`${baseHref}?tab=activity&page=${pageNumber}`}
                    key={pageNumber}
                  >
                    {pageNumber}
                  </a>
                );
              })}
              <select
                className={smsPageStyles.input}
                onChange={(event) => setPageSize(Number(event.target.value))}
                value={pageSize}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </SmsCard>

        <SmsCard>
          <SmsCardHeader
            action={<SmsFooterLink href={`${baseHref}?tab=activity`}>Voir tous</SmsFooterLink>}
            icon={<SmsBellIcon className="h-5 w-5" />}
            title="Événements récents"
          />

          <div className="mt-5 grid gap-5">
            <EventSection
              count={events.deliveryFailures.length}
              emptyLabel="Aucun échec récent"
              items={events.deliveryFailures}
              title="Échecs de livraison"
              tone="danger"
            />
            <EventSection
              count={events.stopReplies.length}
              emptyLabel="Aucune réponse STOP récente"
              items={events.stopReplies}
              title="Réponses STOP"
              tone="danger"
            />
            <EventSection
              count={events.missingCallbacks.length}
              emptyLabel="Aucun callback manquant récent"
              items={events.missingCallbacks}
              title="Callbacks non aboutis"
              tone="warning"
            />
          </div>

          <SmsFooterLink href={`${baseHref}?tab=activity`}>
            Voir tous les événements →
          </SmsFooterLink>
        </SmsCard>
      </div>
    </div>
  );
}

function EventSection({
  title,
  count,
  items,
  emptyLabel,
  tone
}: {
  title: string;
  count: number;
  items: SmsRecentEvents["deliveryFailures"];
  emptyLabel: string;
  tone: "danger" | "warning";
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <p className="text-sm font-black text-[#0b1328]">{title}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            tone === "danger" ? "bg-[#fef2f2] text-red-600" : "bg-[#fff7ed] text-[#f59e0b]"
          }`}
        >
          {count}
        </span>
      </div>
      <ul className="mt-3 grid gap-2">
        {items.length === 0 ? (
          <li className="text-sm text-[#64748b]">{emptyLabel}</li>
        ) : (
          items.map((item) => (
            <li
              className="rounded-xl border border-[#e1e9f5] px-3 py-2 text-sm"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#0b1328]">{item.label}</p>
                  <p className="text-xs text-[#64748b]">{item.detail}</p>
                </div>
                <span className="text-xs font-bold text-[#64748b]">
                  {formatSmsShortTime(item.at)}
                </span>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
