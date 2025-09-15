import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

// Member Schema
const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    plan: { type: String, required: true },
    email: String,
    date: { type: String, required: true },
    price: String,
  },
  { collection: "members" }
);

// Prevent overwrite
const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export async function GET() {
  try {
    await connectToDatabase();
    const members = await Member.find().sort({ date: -1 });
    return NextResponse.json(members || []);
  } catch (error) {
    console.error("❌ Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, mobile, plan, email, date, price } = body;

    if (!name || !mobile || !plan || !date) {
      return NextResponse.json({ success: false, message: "Required fields missing" }, { status: 400 });
    }

    const newMember = new Member({ name, mobile, plan, email, date, price });
    await newMember.save();

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error("❌ Error creating member:", error);
    return NextResponse.json({ success: false, message: "Failed to create member" }, { status: 500 });
  }
}
