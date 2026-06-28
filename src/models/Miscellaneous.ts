import mongoose from "mongoose";

// Schema for Miscellaneous Costs
const MiscellaneousSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  // Store month-year only as string, e.g., "2025-09"
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index
MiscellaneousSchema.index({ tenantId: 1, createdAt: -1 });

// Create model
const Miscellaneous = mongoose.models.Miscellaneous || mongoose.model("Miscellaneous", MiscellaneousSchema);

export default Miscellaneous;
