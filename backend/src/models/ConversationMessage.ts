import mongoose, { Schema } from "mongoose";

const conversationMessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    body: { type: String, required: true, maxlength: 4000 },
    mentions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
      },
    ],
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true },
);

conversationMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const ConversationMessage = mongoose.model("ConversationMessage", conversationMessageSchema);
