import type { Role } from "@/lib/api/types";

export function messageRoleLabel(role: Role | string): string {
  if (role === "admin") return "Admin";
  if (role === "record_management") return "Records";
  return "Client";
}

export function roleSectionLabel(role: Role | string): string {
  return messageRoleLabel(role);
}

export function groupUsersByRole<T extends { role: Role }>(users: T[]) {
  const admin = users.filter((u) => u.role === "admin");
  const records = users.filter((u) => u.role === "record_management");
  const clients = users.filter((u) => u.role === "user");
  return { admin, records, clients };
}
