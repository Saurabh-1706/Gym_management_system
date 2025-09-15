import { connectToDatabase } from "@/lib/mongodb";
import PlanModel from "@/models/Plan";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const plan = await PlanModel.create(body);
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const plans = await PlanModel.find().lean();
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
