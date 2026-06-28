import { ShieldIcon } from "@/components/admin/overview/admin-overview-icons";
import type { AdminProfileInfo } from "@/lib/admin/overview-data";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "long",
  timeStyle: "short"
});

export function AdminProfileCard({ profile }: { profile: AdminProfileInfo }) {
  const lastSeenLabel = profile.lastSeenAt
    ? dateFormatter.format(new Date(profile.lastSeenAt))
    : "Non disponible";

  return (
    <section className="rounded-[20px] border border-[#e1e9f5] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563ff] text-white shadow-[0_10px_30px_rgba(37,99,255,0.25)]">
          <ShieldIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#657492]">Administrateur connecté</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[#0b1328]">{profile.displayName}</h2>
            <span className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold text-[#2563ff]">
              {profile.role}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#657492]">{profile.email}</p>
        </div>
      </div>

      <div className="my-5 h-px bg-[#edf2f9]" />

      <dl className="space-y-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-[#657492]">Accès</dt>
          <dd className="font-semibold text-[#0b1328]">{profile.accessLabel}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-[#657492]">Rôle</dt>
          <dd className="font-semibold text-[#0b1328]">{profile.roleLabel}</dd>
        </div>
        <div className="flex items-start justify-between gap-3">
          <dt className="text-[#657492]">Dernière connexion</dt>
          <dd className="flex items-center gap-2 font-semibold text-[#0b1328]">
            {lastSeenLabel}
            <span aria-label="En ligne" className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
