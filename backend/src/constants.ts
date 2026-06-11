export const ROLES = ["admin", "record_management", "user"] as const;
export type Role = (typeof ROLES)[number];

/** Form definition lifecycle (Admin → Records) */
export const FORM_STATUSES = ["draft", "pending_review", "published", "disapproved"] as const;
export type FormStatus = (typeof FORM_STATUSES)[number];

/** Client request / ticket lifecycle (Client → Admin) */
export const TICKET_STATUSES = [
  "pending_approval",
  "approved",
  "rejected",
  "open",
  "in_progress",
  "pending",
  "resolved",
  "closed",
  "reopened",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const FORM_REVIEW_DECISIONS = ["approved", "disapproved"] as const;
export type FormReviewDecision = (typeof FORM_REVIEW_DECISIONS)[number];
