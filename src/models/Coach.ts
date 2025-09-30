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
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" }, // manual field
  joinDate: { type: Date, default: Date.now, immutable: true }, // auto-set on registration
  profilePicture: { type: String }, // optional URL
  salaryHistory: [salaryHistorySchema],
});

// Export model
const CoachModel = mongoose.models.Coach || mongoose.model("Coach", coachSchema);
export default CoachModel;
