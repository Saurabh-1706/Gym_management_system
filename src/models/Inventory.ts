// models/Inventory.ts
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  manufacturer: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["Active", "Inactive"], required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index
inventorySchema.index({ tenantId: 1, createdAt: -1 });

const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);

export default Inventory;
