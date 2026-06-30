import {
  DashboardPageHeader,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

const permissions = [
  {
    role: "Propriétaire",
    text: "Gère la facturation, les paramètres, l'équipe, les SMS et les confirmations."
  },
  {
    role: "Gestionnaire",
    text: "Envoie des SMS, confirme les clients, consulte les statistiques et gère les services."
  },
  {
    role: "Employé",
    text: "Envoie des SMS et confirme les clients, sans accès à la facturation ni aux paramètres sensibles."
  },
  {
    role: "Lecture seule",
    text: "Consulte des informations limitées sans envoyer de SMS ni confirmer de clients."
  }
];

export default async function TeamPage() {
  const workspace = await getActiveOrganizationWorkspace();
  const currentMember =
    workspace.status === "ready"
      ? {
          email: workspace.user.email ?? workspace.user.id,
          role: workspace.organization.role,
          status: "Actif"
        }
      : null;

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <button
            className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white"
            type="button"
          >
            Inviter un membre
          </button>
        }
        description="Contrôlez qui peut envoyer des SMS, confirmer un client, gérer les services ou accéder aux paramètres sensibles."
        title="Équipe"
      />
      <Panel title="Membres">
        <TableShell>
          <thead>
            <tr>
              <th className={tableHeadClass}>Courriel</th>
              <th className={tableHeadClass}>Rôle</th>
              <th className={tableHeadClass}>Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] bg-white">
            {currentMember ? (
              <tr>
                <td className={`${tableCellClass} font-black`}>
                  {currentMember.email}
                </td>
                <td className={tableCellClass}>{currentMember.role}</td>
                <td className={tableCellClass}>
                  <StatusBadge>{currentMember.status}</StatusBadge>
                </td>
              </tr>
            ) : (
              <tr>
                <td className={tableCellClass} colSpan={3}>
                  Supabase n&apos;est pas configuré.
                </td>
              </tr>
            )}
          </tbody>
        </TableShell>
      </Panel>
      <Panel title="Permissions">
        <div className="grid gap-3 md:grid-cols-2">
          {permissions.map((permission) => (
            <article
              className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
              key={permission.role}
            >
              <h2 className="font-black">{permission.role}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {permission.text}
              </p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
