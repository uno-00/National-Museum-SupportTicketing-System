import type {
  ActivityRecord,
  ApiUser,
  FormRecord,
  FormReviewDecision,
  TicketRecord,
  TicketStatus,
} from "./types";
import {
  AUTH_CHANGED_EVENT,
  getTokenForPath,
  getTokenForSlot,
  pathToSlot,
  type PortalSlot,
} from "@/lib/sessions";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

/** @deprecated Use per-portal sessions — kept for storage event compatibility */
export const AUTH_TOKEN_KEY = "nmp_api_token";
/** @deprecated Use per-portal sessions */
export const AUTH_USER_KEY = "nmp_api_user";

export { AUTH_CHANGED_EVENT };

export function getAuthToken(slot?: PortalSlot): string | null {
  if (slot) return getTokenForSlot(slot);
  if (typeof window === "undefined") return null;
  return getTokenForPath(window.location.pathname);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  slot?: PortalSlot,
): Promise<T> {
  const resolvedSlot =
    slot ?? (typeof window !== "undefined" ? pathToSlot(window.location.pathname) : null);
  const token = resolvedSlot ? getTokenForSlot(resolvedSlot) : null;

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (slot: PortalSlot) =>
    apiFetch<{ user: ApiUser }>("/api/auth/me", undefined, slot),

  // Forms (Admin)
  createForm: (body: object) =>
    apiFetch<{ form: FormRecord }>("/api/forms", { method: "POST", body: JSON.stringify(body) }),
  updateForm: (id: string, body: object) =>
    apiFetch<{ form: FormRecord }>(`/api/forms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  myForms: () => apiFetch<{ items: FormRecord[] }>("/api/forms/mine"),
  getForm: (id: string) => apiFetch<{ form: FormRecord }>(`/api/forms/${id}`),
  submitFormForReview: (id: string) =>
    apiFetch<{ form: FormRecord }>(`/api/forms/${id}/submit-for-review`, { method: "POST" }),
  createAndSubmitForm: (body: object) =>
    apiFetch<{ form: FormRecord }>("/api/forms/submit-to-records", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Published forms (Client)
  publishedForms: () => apiFetch<{ items: FormRecord[] }>("/api/forms/published"),
  getPublishedForm: (id: string) => apiFetch<{ form: FormRecord }>(`/api/forms/published/${id}`),

  // Records — form review
  recordsDashboard: () =>
    apiFetch<{
      pendingCount: number;
      publishedCount: number;
      recentPending: FormRecord[];
      recentPublished: FormRecord[];
      activities: ActivityRecord[];
    }>("/api/records/dashboard"),
  recordsForms: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<{ items: FormRecord[]; total: number; pendingCount: number }>(
      `/api/records/forms${q ? `?${q}` : ""}`,
    );
  },
  getRecordsForm: (id: string) =>
    apiFetch<{ form: FormRecord }>(`/api/records/forms/${id}`),
  reviewForm: (id: string, body: { decision: FormReviewDecision; remarks?: string }) =>
    apiFetch<{ form: FormRecord }>(`/api/records/forms/${id}/review`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  recordsActivity: () => apiFetch<{ items: ActivityRecord[] }>("/api/records/activity"),

  // Tickets
  createTicket: (body: object) =>
    apiFetch<{ ticket: TicketRecord }>("/api/tickets", { method: "POST", body: JSON.stringify(body) }),
  myTickets: () => apiFetch<{ items: TicketRecord[] }>("/api/tickets/mine"),
  listTickets: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch<{ items: TicketRecord[]; total: number; pendingCount: number }>(
      `/api/tickets${q ? `?${q}` : ""}`,
    );
  },
  getTicket: (id: string) => apiFetch<{ ticket: TicketRecord }>(`/api/tickets/${id}`),
  approveTicket: (id: string) =>
    apiFetch<{ ticket: TicketRecord }>(`/api/tickets/${id}/approve`, { method: "POST" }),
  rejectTicket: (id: string, reason: string) =>
    apiFetch<{ ticket: TicketRecord }>(`/api/tickets/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  assignTicket: (id: string, assigneeIds: string[]) =>
    apiFetch<{ ticket: TicketRecord }>(`/api/tickets/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ assigneeIds }),
    }),
  updateTicketStatus: (id: string, status: TicketStatus) =>
    apiFetch<{ ticket: TicketRecord }>(`/api/tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  confirmTicket: (id: string, satisfied: boolean) =>
    apiFetch<{ ticket: TicketRecord }>(`/api/tickets/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ satisfied }),
    }),
  submitFeedback: (id: string, body: { rating: number; comment?: string }) =>
    apiFetch<{ ticket: TicketRecord }>(`/api/tickets/${id}/feedback`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listAssignees: () =>
    apiFetch<{ users: Array<{ _id: string; name: string; email: string; division: string }> }>(
      "/api/tickets/assignees",
    ),

  uploadFile: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch<{
      file: { url: string; originalName: string; mimeType: string; size: number };
    }>("/api/uploads", { method: "POST", body: fd });
  },
};
