import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ElectricityBill from "@/models/ElectricityBill";

// POST → Add new bill
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const bill = await ElectricityBill.create(body);
    return NextResponse.json({ success: true, bill });
  } catch (err) {
    return NextResponse.json({ success: false, error: err });
  }
}

// GET → Fetch all bills
export async function GET() {
  try {
    await connectToDatabase();
    const bills = await ElectricityBill.find().sort({ year: -1, month: -1 });
    return NextResponse.json({ success: true, bills });
  } catch (err) {
    return NextResponse.json({ success: false, error: err });
  }
}
