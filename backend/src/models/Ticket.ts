import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "../constants.js";

const ticketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    formTitle: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    creatorName: { type: String, required: true },
    creatorEmail: { type: String, default: "" },
    division: { type: String, default: "" },
    answers: { type: Schema.Types.Mixed, default: {} },
    attachmentUrl: { type: String, default: "" },
    attachmentName: { type: String, default: "" },
    attachmentMimeType: { type: String, default: "" },
    status: { type: String, enum: TICKET_STATUSES, default: "pending_approval" },
    priority: { type: String, enum: TICKET_PRIORITIES, default: "medium" },
    rejectionReason: { type: String, default: "" },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    feedbackRating: { type: Number, default: null },
    feedbackComment: { type: String, default: "" },
    feedbackSubmitted: { type: Boolean, default: false },
    clientConfirmed: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ticketSchema.index({ status: 1, updatedAt: -1 });
ticketSchema.index({ creatorId: 1, createdAt: -1 });

export type TicketDoc = mongoose.HydratedDocument<InferSchemaType<typeof ticketSchema>>;
export const Ticket = mongoose.model("Ticket", ticketSchema);
