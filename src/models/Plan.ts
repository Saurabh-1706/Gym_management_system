import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  validity: { type: Number, required: true },
  validityType: { type: String, enum: ["days", "months"], default: "months" }, // new field
  amount: { type: Number, required: true },
});

const PlanModel = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default PlanModel;
