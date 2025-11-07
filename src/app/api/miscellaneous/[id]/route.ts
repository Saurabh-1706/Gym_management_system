import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Miscellaneous from "@/models/Miscellaneous";

export async function PUT(req: Request, context: any) {
  try {
    await connectToDatabase();

    const { id } = context.params;
    const body = await req.json();

    const updated = await Miscellaneous.findByIdAndUpdate(id, body, { new: true });
    if (!updated)
      return NextResponse.json({ success: false, message: "Cost not found" });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    console.error("❌ Error updating cost:", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    await connectToDatabase();

    const { id } = context.params;
    const deleted = await Miscellaneous.findByIdAndDelete(id);

    if (!deleted)
      return NextResponse.json({ success: false, message: "Cost not found" });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Error deleting cost:", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
