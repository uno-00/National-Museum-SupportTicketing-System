import type { TicketRecord } from "@/lib/api/types";

const COMPLETABLE_STATUSES = ["open", "in_progress", "pending", "reopened"] as const;

/** ICT work in progress — client may mark service complete when satisfied. */
export function ticketCanMarkComplete(ticket: Pick<TicketRecord, "status">) {
  return COMPLETABLE_STATUSES.includes(ticket.status as (typeof COMPLETABLE_STATUSES)[number]);
}

/** Client marked service done — submit feedback next. */
export function ticketNeedsFeedback(ticket: Pick<TicketRecord, "status" | "feedbackSubmitted">) {
  return ticket.status === "resolved" && !ticket.feedbackSubmitted;
}

/** Feedback submitted — client may close the request. */
export function ticketReadyToClose(ticket: Pick<TicketRecord, "status" | "feedbackSubmitted">) {
  return ticket.status === "resolved" && ticket.feedbackSubmitted;
}

export function countTicketsNeedingFeedback(
  tickets: Array<Pick<TicketRecord, "status" | "feedbackSubmitted">>,
) {
  return tickets.filter(ticketNeedsFeedback).length;
}
