// app/api/registration/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

// Define the schema only once
const MemberSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  date: String,
  plan: String,
  price: String,
});

const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema);

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const data = await req.json();

    console.log("📥 Received:", data); // For debugging

    await Member.create(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json({ success: false, error: error });
  }
}
