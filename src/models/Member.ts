import mongoose, { Schema, model, models } from "mongoose";

// Each installment record
const installmentSchema = new Schema({
  amountPaid: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  modeOfPayment: { type: String, required: true },
});

// Each plan payment record
const paymentSchema = new Schema({
  plan: { type: String, required: true },
  actualAmount: { type: Number, required: true },
  totalPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  installments: { type: [installmentSchema], default: [] },
  paymentStatus: {
    type: String,
    enum: ["Paid", "Unpaid"],
    default: "Unpaid",
  },
  createdAt: { type: Date, default: Date.now },
});

// Automatically update totalPaid, remainingAmount, and paymentStatus
paymentSchema.pre("save", function (next) {
  const totalPaid = this.installments.reduce((sum, i) => sum + i.amountPaid, 0);
  this.totalPaid = totalPaid;
  this.remainingAmount = this.actualAmount - totalPaid;
  this.paymentStatus = this.remainingAmount <= 0 ? "Paid" : "Unpaid";
  next();
});

// Member schema
const memberSchema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  dob: { type: Date, required: true },
  joinDate: { type: Date, default: Date.now, immutable: true },
  profilePicture: { type: String },
  plan: { type: String, default: "No Plan" },
  date: { type: Date, default: null },
  status: { type: String, default: "Inactive" },
  payments: { type: [paymentSchema], default: [] },
});

const Member = models.Member || model("Member", memberSchema);
export default Member;
