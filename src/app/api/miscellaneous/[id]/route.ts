// /app/api/miscellaneous/[id]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Miscellaneous from "@/models/Miscellaneous";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const updated = await Miscellaneous.findByIdAndUpdate(params.id, body, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: "Cost not found" });
    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const deleted = await Miscellaneous.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ success: false, message: "Cost not found" });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
