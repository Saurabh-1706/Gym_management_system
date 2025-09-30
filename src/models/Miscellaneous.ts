import mongoose from "mongoose";

// Schema for Miscellaneous Costs
const MiscellaneousSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Store month-year only as string, e.g., "2025-09"
  date: { type: String, required: true },
  amount: { type: Number, required: true },
});

// Create model
const Miscellaneous = mongoose.models.Miscellaneous || mongoose.model("Miscellaneous", MiscellaneousSchema);

export default Miscellaneous;
