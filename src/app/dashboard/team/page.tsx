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
    role: "Owner",
    text: "Manage everything, including billing, settings, team, SMS and confirmations."
  },
  {
    role: "Manager",
    text: "Send SMS, confirm clients, view analytics, manage services and clients."
  },
  {
    role: "Employee",
    text: "Send SMS and confirm clients. No billing or core settings access."
  },
  {
    role: "Read-only",
    text: "View limited dashboard information without sending SMS or confirming clients."
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
            Invite member
          </button>
        }
        description="Controlez qui peut envoyer des SMS, confirmer un client, gerer les services ou acceder aux parametres sensibles."
        title="Equipe"
      />
      <Panel title="Membres">
        <TableShell>
          <thead>
            <tr>
              <th className={tableHeadClass}>Email</th>
              <th className={tableHeadClass}>Role</th>
              <th className={tableHeadClass}>Status</th>
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
                  Supabase non configure.
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
