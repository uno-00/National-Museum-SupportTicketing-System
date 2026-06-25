import type { ApiUser } from "@/lib/api/types";
import type { PortalSlot } from "@/lib/sessions";

export const LOGIN = "/login";

/** @deprecated Use LOGIN — kept for redirects from old bookmarks */
export const ADMIN_LOGIN = "/admin/login";
export const RECORDS_LOGIN = "/records/login";
export const CLIENT_LOGIN = "/client/login";

export function loginForSlot(_slot: PortalSlot): string {
  return LOGIN;
}

export function isPortalLoginPath(pathname: string): boolean {
  return pathname === LOGIN;
}

export const ADMIN_DASHBOARD = "/admin/dashboard";
export const ADMIN_FORMS = "/admin/forms";
export const ADMIN_MY_FORMS = "/admin/my-forms";
export const ADMIN_APPROVALS = "/admin/approvals";
export const ADMIN_REQUESTS = "/admin/requests";
export const ADMIN_ASSIGNED = "/admin/assigned";
export const ADMIN_REPORTS = "/admin/reports";

export const RECORDS_DASHBOARD = "/records/dashboard";
export const RECORDS_PENDING = "/records/pending";
export const RECORDS_PUBLISHED = "/records/published";
export const RECORDS_ACTIVITY = "/records/activity";

export const CLIENT_DASHBOARD = "/client/dashboard";
export const CLIENT_SUBMIT = "/client/submit";
export const CLIENT_REQUESTS = "/client/requests";
export const CLIENT_FEEDBACK = "/client/feedback";

export function isAdminRole(role: string | undefined) {
  return role === "admin";
}
export function isClientRole(role: string | undefined) {
  return role === "user";
}
export function isRecordsRole(role: string | undefined) {
  return role === "record_management";
}
export function validateAdminUser(user: ApiUser) {
  return isAdminRole(user.role);
}
export function validateClientUser(user: ApiUser) {
  return isClientRole(user.role);
}
export function validateRecordsUser(user: ApiUser) {
  return isRecordsRole(user.role);
}

/** After unified login, redirect by role */
export function dashboardForRole(role: string): string {
  if (isAdminRole(role)) return ADMIN_DASHBOARD;
  if (isRecordsRole(role)) return RECORDS_DASHBOARD;
  if (isClientRole(role)) return CLIENT_DASHBOARD;
  return LOGIN;
}
