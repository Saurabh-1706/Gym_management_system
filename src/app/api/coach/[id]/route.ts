import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoachModel from "@/models/Coach";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid coach ID" });
    }

    const coach = await CoachModel.findById(id).lean();
    if (!coach)
      return NextResponse.json({ success: false, error: "Coach not found" });

    return NextResponse.json({ success: true, coach });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { id } = context.params;
    const { name, mobile, email, status } = await req.json();

    // Build update object only with fields that are provided
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;

    const updatedCoach = await CoachModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedCoach) {
      return NextResponse.json({ success: false, error: "Coach not found" });
    }

    return NextResponse.json({ success: true, coach: updatedCoach });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}
