import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { dashboardBusiness } from "@/lib/dashboard/mock-data";

const sections = [
  {
    title: "Business information",
    fields: ["Business name", "Logo", "Phone", "Address", "Website", "Timezone", "Main language"]
  },
  {
    title: "SMS settings",
    fields: ["SMS sender/number", "Message signature", "Automatic replies", "Opt-out keywords"]
  },
  {
    title: "Notifications",
    fields: ["Email alerts", "New reply notification", "Daily summary"]
  },
  {
    title: "Compliance",
    fields: ["SMS consent required", "STOP / UNSUBSCRIBE handling", "Consent history", "Exclude unsubscribed clients"]
  },
  {
    title: "Import/export",
    fields: ["CSV import", "Client export", "Template export"]
  },
  {
    title: "Account",
    fields: ["Email", "Password", "Session security"]
  }
];

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Paramètres du commerce, langue, SMS, conformité, import/export et compte."
        title="Paramètres"
      />
      <Panel title="Commerce actuel">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="font-black">Business name</dt>
            <dd className="mt-1 text-[var(--muted)]">{dashboardBusiness.name}</dd>
          </div>
          <div>
            <dt className="font-black">Phone</dt>
            <dd className="mt-1 text-[var(--muted)]">{dashboardBusiness.phone}</dd>
          </div>
          <div>
            <dt className="font-black">Timezone</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {dashboardBusiness.timezone}
            </dd>
          </div>
          <div>
            <dt className="font-black">Main language</dt>
            <dd className="mt-1 text-[var(--muted)]">
              {dashboardBusiness.mainLanguage.toUpperCase()}
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
      <Panel title="Compliance basics">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Les clients doivent avoir accepté de recevoir des SMS avant tout envoi.
          Les mots-clés STOP et UNSUBSCRIBE doivent exclure automatiquement les
          clients désinscrits des prochaines alertes.
        </p>
      </Panel>
    </div>
  );
}
