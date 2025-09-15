import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  name: String,
  validity: Number,
  amount: Number,
});

const PlanModel = mongoose.models.Plan || mongoose.model("Plan", planSchema);

export default PlanModel;
