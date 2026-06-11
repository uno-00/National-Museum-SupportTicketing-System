import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ROLES, type Role } from "../constants.js";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    division: { type: String, default: "ICT", trim: true },
    role: { type: String, enum: ROLES, default: "user" satisfies Role },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, active: 1 });
userSchema.index({ name: "text", email: "text" });

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: mongoose.Types.ObjectId };

export const User = mongoose.model("User", userSchema);
