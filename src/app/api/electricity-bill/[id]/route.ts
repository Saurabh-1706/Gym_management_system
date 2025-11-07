// app/api/electricity/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ElectricityBill from "@/models/ElectricityBill";

export async function PUT(
  req: Request,
  context: any) {
  const { id } = await context.params;

  try {
    await connectToDatabase();

    const { id } = await context.params; // 🔹 must await params
    const body = await req.json();
    const { month, year, amount } = body;

    if (!month || !year || !amount) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const updated = await ElectricityBill.findByIdAndUpdate(
      id,
      { month, year, amount },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, bill: updated });
  } catch (error) {
    console.error("❌ Update bill error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update bill" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> } // 🔹 same fix here
) {
  try {
    await connectToDatabase();

    const { id } = await context.params;

    const deleted = await ElectricityBill.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Bill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Bill deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete bill error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete bill" },
      { status: 500 }
    );
  }
}
