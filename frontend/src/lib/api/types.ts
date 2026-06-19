export type Role = "admin" | "record_management" | "user";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  division: string;
};

export type FormStatus = "draft" | "pending_review" | "published" | "disapproved";

export type TicketStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "open"
  | "in_progress"
  | "pending"
  | "resolved"
  | "closed"
  | "reopened";

export type LiveFormField = {
  id: string;
  type: string;
  variable: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type PrintFieldPlacement = {
  id: string;
  variable: string;
  label: string;
  xPct: number;
  yPct: number;
};

export type FormRecord = {
  _id: string;
  title: string;
  description?: string;
  department?: string;
  refNumber: string;
  effectivity: string;
  version: string;
  status: FormStatus;
  fields: LiveFormField[];
  signatories: Array<{ id: string; division: string; name: string }>;
  printTemplate?: string;
  printTemplateImagePath?: string;
  printPlacements?: PrintFieldPlacement[];
  printPlacementFontSize?: number;
  workProcedureName?: string;
  workProcedurePath?: string;
  reviewRemarks?: string;
  reviewedAt?: string;
  submittedForReviewAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { _id: string; name: string; email: string; division: string };
};

export type TicketRecord = {
  _id: string;
  ticketNumber: string;
  formId: string | FormRecord;
  formTitle: string;
  title: string;
  description: string;
  creatorName: string;
  division: string;
  answers: Record<string, unknown>;
  attachmentUrl: string;
  attachmentName: string;
  attachmentMimeType: string;
  status: TicketStatus;
  rejectionReason?: string;
  assignedTo?: Array<{ _id: string; name: string; email: string; division: string }>;
  feedbackRating?: number | null;
  feedbackComment?: string;
  feedbackSubmitted?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActivityRecord = {
  _id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
};

export type FormReviewDecision = "approved" | "disapproved";
