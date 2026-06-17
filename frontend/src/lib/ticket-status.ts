import type { TicketStatus } from "@/lib/api/types";

export type StatusTone = "neutral" | "warning" | "info" | "success" | "danger";

export function formatTicketStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function ticketStatusTone(status: TicketStatus | string): StatusTone {
  switch (status) {
    case "pending_approval":
    case "pending":
    case "reopened":
      return "warning";
    case "approved":
    case "open":
    case "in_progress":
      return "info";
    case "resolved":
    case "closed":
      return "success";
    case "rejected":
      return "danger";
    default:
      return "neutral";
  }
}

export const statusToneClass: Record<StatusTone, string> = {
  neutral: "status-badge-neutral",
  warning: "status-badge-warning",
  info: "status-badge-info",
  success: "status-badge-success",
  danger: "status-badge-danger",
};
