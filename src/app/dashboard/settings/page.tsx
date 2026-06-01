import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { ImportExportPanel } from "@/components/import/import-export-panel";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

const sections = [
  {
    title: "SMS settings",
    fields: ["SMS sender/number", "Message signature", "Automatic replies", "Opt-out keywords"]
  },
  {
    title: "Compliance",
    fields: ["SMS consent required", "STOP / UNSUBSCRIBE handling", "Consent history", "Exclude unsubscribed clients"]
  }
];

export default async function SettingsPage() {
  const workspace = await getActiveOrganizationWorkspace();
  const organization =
    workspace.status === "ready" ? workspace.organization : null;

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Parametres reels de l'organisation et controles de securite SMS."
        title="Parametres"
      />
      <Panel title="Commerce actuel">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-black">Business name</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.name ?? "Supabase non configure"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Phone</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.phone ?? "Non renseigne"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Timezone</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {organization?.timezone ?? "America/Toronto"}
            </dd>
          </div>
          <div>
            <dt className="font-black">Main language</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {(organization?.defaultLanguage ?? "fr").toUpperCase()}
            </dd>
          </div>
        </dl>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Panel key={section.title} title={section.title}>
            <div className="grid gap-3">
              {section.fields.map((field) => (
                <label className="grid gap-2 text-sm font-bold" key={field}>
                  {field}
                  <input
                    className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                    placeholder={field}
                  />
                </label>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      <Panel title="Import / export">
        <ImportExportPanel />
      </Panel>
      <Panel title="Compliance basics">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Les clients doivent avoir accepte de recevoir des SMS avant tout envoi.
          Les mots-cles STOP et UNSUBSCRIBE doivent exclure automatiquement les
          clients desinscrits des prochaines alertes.
        </p>
      </Panel>
    </div>
  );
}
