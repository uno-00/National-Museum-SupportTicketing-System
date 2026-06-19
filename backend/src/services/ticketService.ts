import { Ticket } from "../models/Ticket.js";
import { User } from "../models/User.js";
import type { AuthUser } from "../middleware/auth.js";
import type { TicketStatus } from "../constants.js";
import { AppError } from "../utils/errors.js";
import { generateTicketNumber } from "../utils/ticketNumber.js";
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

  const ticket = await Ticket.create({
    ticketNumber: generateTicketNumber(),
    formId,
    formTitle: form.title,
    title: `${form.title} — ${subject}`,
    description: Object.entries(body.answers)
      .map(([k, v]) => `${k}: ${String(v ?? "")}`)
      .join("\n"),
    creatorId: user.id,
    creatorName: user.name,
    creatorEmail: user.email,
    division: user.division,
    answers: body.answers,
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
    .populate("formId", "title refNumber fields")
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

  const users = await User.find({ _id: { $in: assigneeIds }, role: "admin", active: true });
  if (users.length === 0) throw new AppError(400, "No valid personnel to assign");

  ticket.assignedTo = assigneeIds as never;
  if (ticket.status === "approved" || ticket.status === "open") {
    ticket.status = "in_progress";
  }
  await ticket.save();

  await logActivity(actor, {
    action: "ticket_assigned",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Request ${ticket.ticketNumber} assigned to ${users.map((u) => u.name).join(", ")}`,
    meta: { assigneeIds },
  });

  return ticket.populate("assignedTo", "name email division");
}

export async function updateTicketStatus(actor: AuthUser, id: string, status: TicketStatus) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");

  const prev = ticket.status;
  ticket.status = status;
  if (status === "resolved") ticket.resolvedAt = new Date();
  if (status === "closed") ticket.closedAt = new Date();
  await ticket.save();

  await logActivity(actor, {
    action: "ticket_status_updated",
    entityType: "ticket",
    entityId: ticket._id.toString(),
    summary: `Request ${ticket.ticketNumber}: ${prev} → ${status}`,
  });

  return ticket;
}

export async function clientConfirmResolution(user: AuthUser, id: string, satisfied: boolean) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.creatorId.toString() !== user.id) throw new AppError(403, "Not your request");
  if (ticket.status !== "resolved") throw new AppError(400, "Ticket is not awaiting confirmation");

  if (satisfied) {
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

  return ticket;
}

export async function submitFeedback(
  user: AuthUser,
  id: string,
  body: { rating: number; comment?: string },
) {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError(404, "Ticket not found");
  if (ticket.creatorId.toString() !== user.id) throw new AppError(403, "Not your request");
  if (body.rating < 1 || body.rating > 5) throw new AppError(400, "Rating must be 1–5");

  ticket.feedbackRating = body.rating;
  ticket.feedbackComment = body.comment ?? "";
  ticket.feedbackSubmitted = true;
  if (ticket.status === "resolved") {
    ticket.status = "closed";
    ticket.closedAt = new Date();
  }
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
