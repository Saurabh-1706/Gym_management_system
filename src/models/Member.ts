import mongoose, { Schema, model, models } from "mongoose";

const memberSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  plan: String,
  date: Date,
  status: { type: String, default: "Active" },
  joinDate: { type: Date, default: Date.now, immutable: true },
  profilePicture: { type: String }, // <-- optional field for image (Base64 or URL)
  payments: [
    {
      plan: String,
      price: Number,
      date: Date,
      modeOfPayment: String,
    },
  ],
});

const Member = models.Member || model("Member", memberSchema);
export default Member;
