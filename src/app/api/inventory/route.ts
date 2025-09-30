import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Inventory from "@/models/Inventory";

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Inventory.find({});
    return NextResponse.json({ items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Optional: log the body to see what you are sending
    console.log("POST body:", body);

    const item = await Inventory.create(body);
    return NextResponse.json({ item });
  } catch (err) {
    console.error("Error saving inventory:", err);
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
  }
}