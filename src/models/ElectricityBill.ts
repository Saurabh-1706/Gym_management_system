import mongoose, { Schema, models } from "mongoose";

const electricityBillSchema = new Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    month: { type: String, required: true }, // Example: "September 2025"
    year: { type: Number, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }, // when entry is created
  },
  { timestamps: true }
);

// Compound index
electricityBillSchema.index({ tenantId: 1, createdAt: -1 });

const ElectricityBill =
  models.ElectricityBill || mongoose.model("ElectricityBill", electricityBillSchema);

export default ElectricityBill;
