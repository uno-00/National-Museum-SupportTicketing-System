import { Ticket } from "../models/Ticket.js";
import { User } from "../models/User.js";
import type { AuthUser } from "../middleware/auth.js";
import type { TicketStatus } from "../constants.js";
import { AppError } from "../utils/errors.js";
import { generateTicketNumber } from "../utils/ticketNumber.js";
import { normalizeTicketAnswers, resolveAnswerForVariable } from "../utils/placementValues.js";
import * as formService from "./formService.js";
import { logActivity } from "./activityService.js";

export async function createTicketFromClient(
  user: AuthUser,
  formId: string,
  body: {
    answers: Record<string, unknown>;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentMimeType?: string;
  },
) {
  const form = await formService.getPublishedForm(formId);
  const subject = String(body.answers.txt_subject ?? body.answers.subject ?? form.title);

  if (
    body.attachmentUrl &&
    body.attachmentMimeType &&
    body.attachmentMimeType !== "application/pdf" &&
    !/\.pdf$/i.test(body.attachmentName ?? body.attachmentUrl)
  ) {
    throw new AppError(400, "Only PDF attachments are allowed");
  }

  const storedAnswers = normalizeTicketAnswers(form.fields, body.answers ?? {});

  const formatAnswer = (field: { type: string; label: string; variable: string }, value: unknown) => {
    if (value === undefined || value === null || value === "") return "—";
    if (field.type === "checkbox") return value === true || value === "true" ? "Yes" : "No";
    return String(value);
  };

  const ticket = await Ticket.create({
    ticketNumber: generateTicketNumber(),
    formId,
    formTitle: form.title,
    title: `${form.title} — ${subject}`,
    description: form.fields
      .map((field) => {
        const variable = field.variable ?? "";
        return `${field.label}: ${formatAnswer(
          { type: field.type ?? "textbox", label: field.label ?? variable, variable },
          resolveAnswerForVariable(storedAnswers, variable),
        )}`;
      })
      .join("\n"),
    creatorId: user.id,
    creatorName: user.name,
    creatorEmail: user.email,
    division: user.division,
    answers: storedAnswers,
    attachmentUrl: body.attachmentUrl ?? "",
    attachmentName: body.attachmentName ?? "",
    attachmentMimeType: body.attachmentMimeType ?? "",
    status: "pending_approval",
  });

  await logActivity(user, {
    action: "ticket_created",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Request ${ticket.ticketNumber} submitted — pending admin approval`,
  });

  const { ensureTicketConversation } = await import("./ticketConversationService.js");
  await ensureTicketConversation(ticket._id.toString());

  return ticket;
}

export async function listTicketsForAdmin(query: {
  status?: TicketStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, query.limit ?? 20);
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (query.search?.trim()) {
    filter.$or = [
      { title: new RegExp(query.search.trim(), "i") },
      { ticketNumber: new RegExp(query.search.trim(), "i") },
      { creatorName: new RegExp(query.search.trim(), "i") },
    ];
  }

  const [items, total, pendingCount] = await Promise.all([
    Ticket.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("assignedTo", "name email division")
      .lean(),
    Ticket.countDocuments(filter),
    Ticket.countDocuments({ status: "pending_approval" }),
  ]);

  return { items, total, page, limit, pendingCount };
}

export async function listTicketsForClient(userId: string) {
  return Ticket.find({ creatorId: userId })
    .sort({ createdAt: -1 })
    .populate("assignedTo", "name email division")
    .lean();
}

export async function getTicketById(id: string) {
  const ticket = await Ticket.findById(id)
    .populate("assignedTo", "name email division")
    .populate("creatorId", "name email division")
    .populate(
      "formId",
      "title refNumber fields printTemplate printTemplateImagePath printPlacements printPlacementFontSize workProcedurePath workProcedureName",
    )
    .lean();
  if (!ticket) throw new AppError(404, "Ticket not found");
  return ticket;
}

export function assertTicketAccess(
  user: AuthUser,
  ticket: { creatorId: { _id?: { toString(): string }; toString(): string } | string },
) {
  if (user.role === "admin") return;
  let creatorId: string;
  if (typeof ticket.creatorId === "object" && ticket.creatorId !== null) {
    creatorId = ticket.creatorId._id
      ? ticket.creatorId._id.toString()
      : ticket.creatorId.toString();
  } else {
    creatorId = String(ticket.creatorId);
  }
  if (user.role === "user" && creatorId === user.id) return;
  throw new AppError(403, "You do not have access to this request");
}

export async function approveTicket(actor: AuthUser, id: string) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.status !== "pending_approval") throw new AppError(400, "Ticket is not pending approval");

  ticket.status = "open";
  await ticket.save();

  await logActivity(actor, {
    action: "ticket_approved",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Request ${ticket.ticketNumber} approved`,
  });

  const { syncTicketConversationParticipants } = await import("./ticketConversationService.js");
  await syncTicketConversationParticipants(ticket._id.toString());

  return ticket;
}

export async function rejectTicket(actor: AuthUser, id: string, reason: string) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.status !== "pending_approval") throw new AppError(400, "Ticket is not pending approval");

  ticket.status = "rejected";
  ticket.rejectionReason = reason;
  await ticket.save();

  await logActivity(actor, {
    action: "ticket_rejected",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Request ${ticket.ticketNumber} rejected`,
    meta: { reason },
  });

  return ticket;
}

export async function assignTicket(actor: AuthUser, id: string, assigneeIds: string[]) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.status === "pending_approval") {
    throw new AppError(400, "Approve the request before assigning personnel");
  }
  if (["rejected", "closed"].includes(ticket.status)) {
    throw new AppError(400, "Cannot assign personnel to a closed or rejected request");
  }

  const users = await User.find({ _id: { $in: assigneeIds }, role: "admin", active: true });
  if (users.length === 0) throw new AppError(400, "No valid personnel to assign");

  ticket.assignedTo = assigneeIds as never;
  if (!["resolved", "closed"].includes(ticket.status)) {
    ticket.status = "in_progress";
  }
  await ticket.save();

  await logActivity(actor, {
    action: "ticket_assigned",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Request ${ticket.ticketNumber} assigned to ${users.map((u) => u.name).join(", ")} — in progress`,
    meta: { assigneeIds },
  });

  const { syncTicketConversationParticipants } = await import("./ticketConversationService.js");
  await syncTicketConversationParticipants(ticket._id.toString());

  return ticket.populate("assignedTo", "name email division");
}

const ADMIN_STATUS_UPDATES: TicketStatus[] = ["open", "in_progress", "pending", "reopened"];

export async function updateTicketStatus(actor: AuthUser, id: string, status: TicketStatus) {
  if (status === "closed") {
    throw new AppError(403, "Only the client can close a completed request");
  }
  if (!ADMIN_STATUS_UPDATES.includes(status)) {
    throw new AppError(400, "Invalid status update");
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");

  const prev = ticket.status;
  ticket.status = status;
  if (status === "resolved") ticket.resolvedAt = new Date();
  await ticket.save();

  await logActivity(actor, {
    action: "ticket_status_updated",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Request ${ticket.ticketNumber}: ${prev} → ${status}`,
  });

  return ticket;
}

export async function listTicketsAssignedToAdmin(userId: string) {
  return Ticket.find({
    assignedTo: userId,
    status: { $in: ["open", "in_progress", "pending", "reopened"] },
  })
    .sort({ updatedAt: -1 })
    .populate("assignedTo", "name email division")
    .lean();
}

export async function completeTicketService(actor: AuthUser, id: string) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.creatorId.toString() !== actor.id) {
    throw new AppError(403, "Only the client can mark this service complete");
  }

  if (!["open", "in_progress", "pending", "reopened"].includes(ticket.status)) {
    throw new AppError(400, "This request is not awaiting service completion");
  }

  ticket.status = "resolved";
  ticket.resolvedAt = new Date();
  await ticket.save();

  await logActivity(actor, {
    action: "ticket_service_completed",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Client marked ${ticket.ticketNumber} complete — feedback pending`,
  });

  return ticket.populate("assignedTo", "name email division");
}

export async function clientConfirmResolution(user: AuthUser, id: string, satisfied: boolean) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.creatorId.toString() !== user.id) throw new AppError(403, "Not your request");
  if (ticket.status !== "resolved") throw new AppError(400, "Ticket is not awaiting client action");

  if (satisfied) {
    if (!ticket.feedbackSubmitted) {
      throw new AppError(400, "Submit feedback before closing this request");
    }
    ticket.status = "closed";
    ticket.clientConfirmed = true;
    ticket.closedAt = new Date();
  } else {
    ticket.status = "reopened";
    ticket.clientConfirmed = false;
  }
  await ticket.save();

  await logActivity(user, {
    action: satisfied ? "ticket_confirmed" : "ticket_reopened",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: satisfied
      ? `Client confirmed resolution for ${ticket.ticketNumber}`
      : `Client reopened ${ticket.ticketNumber}`,
  });

  const { setTicketConversationClosedState } = await import("./ticketConversationService.js");
  await setTicketConversationClosedState(ticket._id.toString(), satisfied);

  return ticket;
}

export async function submitFeedback(
  user: AuthUser,
  id: string,
  body: { rating?: number; comment?: string },
) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.creatorId.toString() !== user.id) throw new AppError(403, "Not your request");
  if (ticket.status !== "resolved") {
    throw new AppError(400, "Mark the service complete before submitting feedback");
  }
  if (ticket.feedbackSubmitted) {
    throw new AppError(400, "Feedback was already submitted for this request");
  }
  if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
    throw new AppError(400, "Rating must be 1–5");
  }

  ticket.feedbackRating = body.rating ?? null;
  ticket.feedbackComment = body.comment?.trim() ?? "";
  ticket.feedbackSubmitted = true;
  await ticket.save();

  await logActivity(user, {
    action: "feedback_submitted",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Feedback submitted for ${ticket.ticketNumber} (${body.rating}/5)`,
  });

  return ticket;
}

export async function listAssignees() {
  return User.find({ role: "admin", active: true })
    .select("name email division role")
    .sort({ name: 1 })
    .lean();
}
