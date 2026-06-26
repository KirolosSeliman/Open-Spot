export const workspaceMemberStatuses = ["active", "invited"] as const;

export type WorkspaceMemberStatus = (typeof workspaceMemberStatuses)[number];

export function isWorkspaceMemberStatus(
  status: string
): status is WorkspaceMemberStatus {
  return workspaceMemberStatuses.includes(status as WorkspaceMemberStatus);
}
