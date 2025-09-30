import mongoose, { Schema, models } from "mongoose";

const electricityBillSchema = new Schema(
  {
    month: { type: String, required: true }, // Example: "September 2025"
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }, // when entry is created
  },
  { timestamps: true }
);

const ElectricityBill =
  models.ElectricityBill || mongoose.model("ElectricityBill", electricityBillSchema);

export default ElectricityBill;
