import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    type: { type: String, enum: ["direct", "group", "ticket"], required: true },
    participantIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    directKey: { type: String, unique: true, sparse: true },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", unique: true, sparse: true },
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date, default: null },
    title: { type: String, default: "" },
    isGlobal: { type: Boolean, default: false },
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: "" },
    lastSenderName: { type: String, default: "" },
  },
  { timestamps: true },
);

conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
conversationSchema.index({ isGlobal: 1 });
conversationSchema.index({ ticketId: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
