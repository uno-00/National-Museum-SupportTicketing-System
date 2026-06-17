import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { FORM_STATUSES } from "../constants.js";

const fieldSchema = new Schema(
  {
    id: String,
    type: String,
    variable: String,
    label: String,
    placeholder: String,
    required: Boolean,
    options: [String],
    minLength: Number,
    maxLength: Number,
    defaultValue: String,
  },
  { _id: false },
);

const signatorySchema = new Schema(
  {
    id: String,
    division: String,
    name: String,
  },
  { _id: false },
);

const placementSchema = new Schema(
  {
    id: String,
    variable: String,
    label: String,
    xPct: Number,
    yPct: Number,
  },
  { _id: false },
);

const formSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    refNumber: { type: String, required: true, unique: true },
    effectivity: { type: String, default: "" },
    version: { type: String, default: "v1.0" },
    fields: { type: [fieldSchema], default: [] },
    signatories: { type: [signatorySchema], default: [] },
    printTemplate: { type: String, default: "" },
    printTemplateImagePath: { type: String, default: null },
    printPlacements: { type: [placementSchema], default: [] },
    printPlacementFontSize: { type: Number, default: 10 },
    workProcedureName: { type: String, default: "" },
    workProcedurePath: { type: String, default: null },
    status: { type: String, enum: FORM_STATUSES, default: "draft" },
    description: { type: String, default: "" },
    department: { type: String, default: "" },
    reviewRemarks: { type: String, default: "" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    submittedForReviewAt: { type: Date, default: null },
    duplicatedFrom: { type: Schema.Types.ObjectId, ref: "Form", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

formSchema.index({ status: 1, updatedAt: -1 });
formSchema.index({ title: "text", refNumber: "text" });

export const Form = mongoose.model("Form", formSchema);
