import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  validity: { type: Number, required: true },
  validityType: { type: String, enum: ["days", "months"], default: "months" }, // new field
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index
planSchema.index({ tenantId: 1, createdAt: -1 });

const PlanModel = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default PlanModel;
