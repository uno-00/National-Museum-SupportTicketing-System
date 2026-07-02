import mongoose, { Schema } from "mongoose";

const pokeSchema = new Schema(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", default: null },
  },
  { timestamps: true },
);

pokeSchema.index({ fromUserId: 1, toUserId: 1, createdAt: -1 });

export const Poke = mongoose.model("Poke", pokeSchema);
