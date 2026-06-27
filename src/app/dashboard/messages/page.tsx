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
  },
  {
    id: "confirmation_fr",
    name: "Confirmation manuelle FR",
    locale: "fr",
    body: "Bonjour {client_name}, votre rendez-vous chez {business_name} est confirme pour {service_name} le {appointment_date} a {appointment_time}. Adresse : {business_address}. A bientot! Repondez AIDE pour de l'aide ou STOP pour vous desinscrire."
  },
  {
    id: "confirmation_en",
    name: "Manual confirmation EN",
    locale: "en",
    body: "Hi {client_name}, your appointment at {business_name} is confirmed for {service_name} on {appointment_date} at {appointment_time}. Address: {business_address}. See you soon! Reply HELP for help or STOP to unsubscribe."
  }
];

const variables = [
  "{business_name}",
  "{service_name}",
  "{appointment_date}",
  "{appointment_time}",
  "{client_name}",
  "{business_address}",
  "{employee_name}",
  "{estimated_price}",
  "{reply_keyword}"
];

export default function MessagesPage() {
  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Modeles SMS generiques pour preparer une copie claire, consentie et validee par le commerçant."
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
            L&apos;alerte de creneau libre doit rappeler que le rendez-vous est
            confirme seulement apres validation de l&apos;equipe. Le message de
            confirmation manuelle est envoye automatiquement au client une fois
            que vous confirmez un repondant.
          </p>
        </Panel>
      </div>
    </div>
  );
}
