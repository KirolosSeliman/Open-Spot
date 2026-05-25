export const organizationRoles = [
  "owner",
  "manager",
  "staff",
] as const;

export type OrganizationRole = (typeof organizationRoles)[number];
