import mongoose, { Schema, Document, model, models } from "mongoose";

export interface ITenant extends Document {
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  plan: "free" | "pro" | "enterprise";
  planLimits: {
    maxMembers: number;
    maxStaff: number;
  };
  ownerEmail: string;
  isActive: boolean;
  createdAt: Date;
}

const TenantSchema = new Schema<ITenant>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  logo: { type: String },
  primaryColor: { type: String, default: "#F97316" },
  plan: { type: String, enum: ["free", "pro", "enterprise"], default: "free" },
  planLimits: {
    maxMembers: { type: Number, default: 100 },
    maxStaff: { type: Number, default: 5 },
  },
  ownerEmail: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Tenant = models.Tenant || model<ITenant>("Tenant", TenantSchema);
export default Tenant;
