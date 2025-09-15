import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

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

const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id } = params;

    const updatedMember = await Member.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updatedMember) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error("❌ Error updating member:", error);
    return NextResponse.json({ success: false, message: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const { id } = params;

    const deleted = await Member.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error deleting member:", error);
    return NextResponse.json({ success: false, message: "Failed to delete member" }, { status: 500 });
  }
}
