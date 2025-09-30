// /app/api/miscellaneous/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Miscellaneous from "@/models/Miscellaneous";

export async function GET() {
  try {
    await connectToDatabase();
    const costs = await Miscellaneous.find({}).sort({ date: -1 });
    return NextResponse.json({ success: true, costs });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const cost = await Miscellaneous.create(body);
    return NextResponse.json({ success: true, cost });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message });
  }
}
