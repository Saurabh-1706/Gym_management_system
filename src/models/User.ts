import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: string; // explicitly declare _id as string
  tenantId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string; // hashed in DB
  role: string; // e.g. "gym_admin", "staff"
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "gym_admin" },
  createdAt: { type: Date, default: Date.now },
});

// Compound index
UserSchema.index({ tenantId: 1, createdAt: -1 });

// When exporting, make sure TS knows the model type
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;
