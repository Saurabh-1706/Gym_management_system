import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoachModel from "@/models/Coach";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { coachId, amount, date } = await req.json();

    const coach = await CoachModel.findById(coachId);
    if (!coach) return NextResponse.json({ success: false, error: "Coach not found" });

    coach.salaryHistory.push({ amountPaid: amount, paidOn: date });
    await coach.save();

    const coaches = await CoachModel.find({});
    return NextResponse.json({ success: true, coaches });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: (err as Error).message });
  }
}
