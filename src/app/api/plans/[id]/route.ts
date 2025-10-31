import { connectToDatabase } from "@/lib/mongodb";
import PlanModel from "@/models/Plan";
import { NextResponse } from "next/server";
import { Types } from "mongoose";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const result = await PlanModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Plan deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

// ----------------- PUT /api/plans/:id -----------------
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, message: "Invalid ID format" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, validity, amount, validityType } = body;

    if (!name || !validity || !amount) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const updatedPlan = await PlanModel.findByIdAndUpdate(
      id,
      { name, validity, amount, validityType },
      { new: true }
    );

    if (!updatedPlan) {
      return NextResponse.json({ success: false, message: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
