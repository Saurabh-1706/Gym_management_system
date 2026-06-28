import mongoose from "mongoose";

// Salary sub-schema
const salaryHistorySchema = new mongoose.Schema(
  {
    amountPaid: { type: Number, required: true },
    paidOn: { type: Date, required: true },
  },
  { _id: false }
);

// Coach schema
const coachSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }, // manual field
  joinDate: { type: Date, default: Date.now, immutable: true }, // auto-set on registration
  profilePicture: { type: String }, // optional URL
  salaryHistory: [salaryHistorySchema],
  createdAt: { type: Date, default: Date.now },
});

// Compound index
coachSchema.index({ tenantId: 1, createdAt: -1 });

// Export model
const CoachModel = mongoose.models.Coach || mongoose.model("Coach", coachSchema);
export default CoachModel;
