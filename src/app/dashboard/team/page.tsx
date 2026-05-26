import {
  DashboardPageHeader,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { dashboardTeam } from "@/lib/dashboard/mock-data";

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

export default function TeamPage() {
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
        description="Contrôlez qui peut envoyer des SMS, confirmer un client, gérer les services ou accéder aux paramètres sensibles."
        title="Équipe"
      />
      <Panel title="Membres">
        <TableShell>
          <thead>
            <tr>
              <th className={tableHeadClass}>Name</th>
              <th className={tableHeadClass}>Email</th>
              <th className={tableHeadClass}>Role</th>
              <th className={tableHeadClass}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] bg-white">
            {dashboardTeam.map((member) => (
              <tr key={member.id}>
                <td className={`${tableCellClass} font-black`}>{member.name}</td>
                <td className={tableCellClass}>{member.email}</td>
                <td className={tableCellClass}>{member.role}</td>
                <td className={tableCellClass}>
                  <StatusBadge>{member.status}</StatusBadge>
                </td>
              </tr>
            ))}
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
