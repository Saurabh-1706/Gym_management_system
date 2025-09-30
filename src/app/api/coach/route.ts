import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoachModel from "@/models/Coach";

export async function GET() {
  try {
    await connectToDatabase();
    const coaches = await CoachModel.find({});
    return NextResponse.json({ success: true, coaches });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const coach = await CoachModel.create(body); // no salary required here
    return NextResponse.json({ success: true, coach });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}
