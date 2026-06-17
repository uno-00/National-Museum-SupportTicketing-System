import mongoose, { Schema, type InferSchemaType } from "mongoose";

const activityLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, default: "System" },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    summary: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
