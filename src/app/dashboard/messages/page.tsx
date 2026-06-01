import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";

const templates = [
  {
    id: "opening_fr",
    name: "Last-minute opening FR",
    locale: "fr",
    body: "Bonjour, une place vient de se liberer chez {business_name} le {appointment_date} a {appointment_time} pour {service_name}. Repondez OUI si vous etes interesse. Votre rendez-vous sera confirme seulement apres validation par notre equipe."
  },
  {
    id: "opening_en",
    name: "Last-minute opening EN",
    locale: "en",
    body: "Hi, a spot just opened at {business_name} on {appointment_date} at {appointment_time} for {service_name}. Reply YES if you are interested. Your appointment will only be confirmed after our team validates it."
  }
];

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
        description="Modeles SMS generiques. Aucun message reel n'est envoye depuis cette page."
        title="Messages"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.6fr]">
        <Panel title="Templates SMS">
          <div className="grid gap-4">
            {templates.map((template) => (
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
                </div>
                <textarea
                  className="mt-4 min-h-28 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6"
                  defaultValue={template.body}
                />
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
            confirme seulement apres validation de l&apos;equipe.
          </p>
        </Panel>
      </div>
    </div>
  );
}
