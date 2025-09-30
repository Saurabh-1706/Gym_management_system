// app/api/electricity/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ElectricityBill from "@/models/ElectricityBill"; // your model

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { month, year, amount } = body;

    if (!month || !year || !amount) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const updated = await ElectricityBill.findByIdAndUpdate(
      params.id,
      { month, year, amount },
      { new: true } // return updated document
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, bill: updated });
  } catch (error) {
    console.error("❌ Update bill error:", error);
    return NextResponse.json({ success: false, error: "Failed to update bill" }, { status: 500 });
  }
}

// DELETE bill by id
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();

    const deleted = await ElectricityBill.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Bill deleted successfully" });
  } catch (error) {
    console.error("❌ Delete bill error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete bill" }, { status: 500 });
  }
}
