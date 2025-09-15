import mongoose, { Schema, model, models } from "mongoose";

const memberSchema = new Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String },
  date: { type: Date, required: true },
  plan: { type: String, required: true },
  price: { type: Number },
});

const Member = models.Member || model("Member", memberSchema);
export default Member;
