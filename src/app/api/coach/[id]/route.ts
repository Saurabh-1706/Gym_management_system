import { NextResponse, type RouteContext } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoachModel from "@/models/Coach";
import mongoose from "mongoose";

// ✅ Use RouteContext instead of custom type
export async function GET(req: Request, context: RouteContext) {
  try {
    await connectToDatabase();

    const id = context.params?.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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

export async function PUT(req: Request, context: RouteContext) {
  try {
    await connectToDatabase();

    const id = context.params?.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid coach ID" });
    }

    const { name, mobile, email, status } = await req.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;

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
