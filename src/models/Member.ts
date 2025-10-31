import mongoose, { Schema, model, models } from "mongoose";

// Payment sub-schema
const paymentSchema = new Schema({
  plan: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: Date, required: true },
  modeOfPayment: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Unpaid"],
    default: "Unpaid",
  },
});

// Member schema
const memberSchema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  dob: { type: Date, required: true },
  joinDate: { type: Date, default: Date.now, immutable: true },
  profilePicture: { type: String },

  // These are optional now since plan/payment will be handled later
  plan: { type: String, default: "No Plan" },
  date: { type: Date, default: null },
  status: { type: String, default: "Inactive" }, // 👈 Member is inactive until plan assigned

  payments: { type: [paymentSchema], default: [] },
});

// Use existing model if already compiled
const Member = models.Member || model("Member", memberSchema);
export default Member;
