import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoachModel from "@/models/Coach";
import mongoose from "mongoose";

export async function GET(req: Request, context: any) {
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

export async function PUT(req: Request, context: any) {
  try {
    await connectToDatabase();

    const { id } = context.params;
    const { name, mobile, email, status, profilePicture } = await req.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const updatedCoach = await CoachModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedCoach) {
      return NextResponse.json({ success: false, error: "Coach not found" });
    }

    return NextResponse.json({ success: true, coach: updatedCoach });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    await connectToDatabase();

    const { id } = context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid coach ID" });
    }

    const deletedCoach = await CoachModel.findByIdAndDelete(id);

    if (!deletedCoach) {
      return NextResponse.json({ success: false, error: "Coach not found" });
    }

    return NextResponse.json({ success: true, message: "Coach deleted successfully" });
  } catch (err) {
    console.error("Error deleting coach:", err);
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}
