import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Inventory from "@/models/Inventory";

export async function PUT(req: Request, context: any) {
  try {
    await connectToDatabase();

    const { id } = context.params;
    const body = await req.json();

    const updated = await Inventory.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ item: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    await connectToDatabase();

    const { id } = context.params;

    await Inventory.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
