import type { OrganizationRole } from "@/lib/auth/roles";

const setupRoles: OrganizationRole[] = ["owner", "manager"];
const operationsRoles: OrganizationRole[] = ["owner", "manager", "staff"];

export function canManageOrganizationSettings(role: OrganizationRole) {
  return setupRoles.includes(role);
}

export function canManageServices(role: OrganizationRole) {
  return setupRoles.includes(role);
}

export function canManageCustomers(role: OrganizationRole) {
  return setupRoles.includes(role);
}

export function canValidateBookings(role: OrganizationRole) {
  return operationsRoles.includes(role);
}

export function canManageAppointments(role: OrganizationRole) {
  return operationsRoles.includes(role);
}
