import mongoose, { Schema, model, models } from "mongoose";

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: String,
  plan: String,
  date: Date,
  status: { type: String, default: "Active" },
  joinDate: { type: Date, default: Date.now, immutable: true },
  dob: { type: Date, required: true }, // ✅ New Date of Birth field
  profilePicture: { type: String }, // optional field for image (Base64 or URL)
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
