import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { dashboardTemplates } from "@/lib/dashboard/mock-data";

const variables = [
  "{business_name}",
  "{service_name}",
  "{appointment_date}",
  "{appointment_time}",
  "{employee_name}",
  "{estimated_price}",
  "{reply_keyword}"
];

export default function MessagesPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Modèles SMS bilingues, aperçu, variables disponibles et réinitialisation. Aucun message réel n'est envoyé depuis cette page."
        title="Messages"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.6fr]">
        <Panel title="Templates SMS">
          <div className="grid gap-4">
            {dashboardTemplates.map((template) => (
              <article
                className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                key={template.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-black">{template.name}</h2>
                    <p className="mt-1 text-xs font-bold uppercase text-[var(--muted)]">
                      {template.locale}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black"
                      type="button"
                    >
                      Reset to default
                    </button>
                    <button
                      className="rounded-full bg-[var(--primary)] px-3 py-1.5 text-xs font-black text-white"
                      type="button"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
                <textarea
                  className="mt-4 min-h-28 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6"
                  defaultValue={template.body}
                />
                <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-6 text-[var(--muted)]">
                  Preview: {template.body}
                </p>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Variables disponibles">
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <span
                className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-black"
                key={variable}
              >
                {variable}
              </span>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-[#edf8f3] p-4 text-sm font-bold leading-6 text-[var(--primary-strong)]">
            Les templates doivent toujours rappeler que le rendez-vous est
            confirmé seulement après validation de l&apos;équipe.
          </p>
        </Panel>
      </div>
    </div>
  );
}
