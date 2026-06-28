import { ShieldIcon } from "@/components/admin/overview/admin-overview-icons";
import { adminOverviewCardClassName } from "@/components/admin/overview/admin-overview-panel";
import type { AdminProfileInfo } from "@/lib/admin/overview-data";
import { cn } from "@/lib/utils/cn";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "long",
  timeStyle: "short"
});

export function AdminProfileCard({
  profile,
  className
}: {
  profile: AdminProfileInfo;
  className?: string;
}) {
  const lastSeenLabel = profile.lastSeenAt
    ? dateFormatter.format(new Date(profile.lastSeenAt))
    : "Non disponible";

  return (
    <section
      className={cn(
        adminOverviewCardClassName,
        "bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_100%)] p-6",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#2563ff] text-white shadow-[0_10px_24px_rgba(37,99,255,0.28)]">
          <ShieldIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#657492]">Administrateur connecté</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-[#0b1328]">{profile.displayName}</h2>
            <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-semibold text-[#2563ff]">
              {profile.role}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-[#657492]">{profile.email}</p>
        </div>
      </div>

      <div className="my-5 h-px bg-[#e1e9f5]" />

      <dl className="space-y-4 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-[#657492]">Accès</dt>
          <dd className="text-right font-semibold text-[#0b1328]">{profile.accessLabel}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-[#657492]">Rôle</dt>
          <dd className="text-right font-semibold text-[#0b1328]">{profile.roleLabel}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-[#657492]">Dernière connexion</dt>
          <dd className="flex items-center gap-2 text-right font-semibold text-[#0b1328]">
            <span>{lastSeenLabel}</span>
            <span aria-label="En ligne" className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
