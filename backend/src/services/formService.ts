import { Form } from "../models/Form.js";
import type { AuthUser } from "../middleware/auth.js";
import type { FormReviewDecision } from "../constants.js";
import { AppError } from "../utils/errors.js";
import { generateFormRef } from "../utils/ticketNumber.js";
import { logActivity } from "./activityService.js";

async function requireForm(id: string) {
  const doc = await Form.findById(id);
  if (!doc) throw new AppError(404, "Form not found");
  return doc;
}

export async function createForm(user: AuthUser, body: Record<string, unknown>) {
  const form = await Form.create({
    ...body,
    refNumber: body.refNumber ?? generateFormRef(),
    status: "draft",
    createdBy: user.id,
    updatedBy: user.id,
  });
  await logActivity(user, {
    action: "form_created",
    entityType: "form",
    entityId: form._id.toString(),
    summary: `Form "${form.title}" created as draft`,
  });
  return form;
}

export async function updateForm(user: AuthUser, formId: string, body: Record<string, unknown>) {
  const form = await requireForm(formId);
  if (!["draft", "disapproved"].includes(form.status)) {
    throw new AppError(400, "Only draft or disapproved forms can be edited");
  }
  Object.assign(form, body, { updatedBy: user.id });
  await form.save();
  return form;
}

export async function listMyForms(user: AuthUser) {
  return Form.find({ createdBy: user.id }).sort({ updatedAt: -1 }).lean();
}

export async function getFormById(id: string) {
  const form = await Form.findById(id).populate("createdBy", "name email division").lean();
  if (!form) throw new AppError(404, "Form not found");
  return form;
}

/** Create form and submit to Records in one step (avoids orphan drafts). */
export async function createAndSubmitForReview(user: AuthUser, body: Record<string, unknown>) {
  const form = await createForm(user, body);
  return submitFormForReview(user, form._id.toString());
}

/** Admin submits form to Records — does NOT auto-publish */
export async function submitFormForReview(user: AuthUser, formId: string) {
  const form = await requireForm(formId);
  if (!["draft", "disapproved"].includes(form.status)) {
    throw new AppError(400, "Only draft or disapproved forms can be submitted for review");
  }
  form.status = "pending_review";
  form.submittedForReviewAt = new Date();
  form.reviewRemarks = "";
  form.updatedBy = user.id as never;
  await form.save();

  await logActivity(user, {
    action: "form_submitted_for_review",
    entityType: "form",
    entityId: form._id.toString(),
    summary: `Form "${form.title}" submitted to Records for review`,
  });
  return form;
}

export async function listFormsForRecords(query: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, query.limit ?? 20);
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  else filter.status = { $in: ["pending_review", "published", "disapproved"] };

  if (query.search?.trim()) {
    filter.$or = [
      { title: new RegExp(query.search.trim(), "i") },
      { department: new RegExp(query.search.trim(), "i") },
    ];
  }

  const [items, total, pendingCount] = await Promise.all([
    Form.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("createdBy", "name email division")
      .lean(),
    Form.countDocuments(filter),
    Form.countDocuments({ status: "pending_review" }),
  ]);

  return { items, total, page, limit, pendingCount };
}

export async function reviewForm(
  reviewer: AuthUser,
  formId: string,
  body: { decision: FormReviewDecision; remarks?: string },
) {
  const existing = await requireForm(formId);

  // Idempotent — double-click or stale tab after a successful review.
  if (existing.status !== "pending_review") {
    if (body.decision === "approved" && existing.status === "published") {
      return existing;
    }
    if (body.decision === "disapproved" && existing.status === "disapproved") {
      return existing;
    }
    const label = existing.status.replace(/_/g, " ");
    throw new AppError(
      400,
      `This form is already ${label}. Go back to Pending Forms and pick another entry.`,
    );
  }

  const nextStatus = body.decision === "approved" ? "published" : "disapproved";
  const reviewRemarks =
    body.decision === "approved"
      ? (body.remarks ?? "")
      : (body.remarks ?? "Please revise and resubmit.");

  const form = await Form.findOneAndUpdate(
    { _id: formId, status: "pending_review" },
    {
      $set: {
        status: nextStatus,
        reviewRemarks,
        reviewedBy: reviewer.id,
        reviewedAt: new Date(),
        updatedBy: reviewer.id,
      },
    },
    { new: true },
  );

  if (!form) {
    const current = await requireForm(formId);
    if (body.decision === "approved" && current.status === "published") {
      return current;
    }
    if (body.decision === "disapproved" && current.status === "disapproved") {
      return current;
    }
    throw new AppError(400, "This form was just reviewed by another session. Refresh the list.");
  }

  await logActivity(reviewer, {
    action: body.decision === "approved" ? "form_approved" : "form_disapproved",
    entityType: "form",
    entityId: form._id.toString(),
    summary: `Form "${form.title}" ${body.decision} by Records`,
    meta: { remarks: form.reviewRemarks },
  });

  return form;
}

export async function listPublishedForms() {
  return Form.find({ status: "published" }).sort({ updatedAt: -1 }).lean();
}

export async function getPublishedForm(id: string) {
  const form = await Form.findOne({ _id: id, status: "published" }).lean();
  if (!form) throw new AppError(404, "Published form not found");
  return form;
}
