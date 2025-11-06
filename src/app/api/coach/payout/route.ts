import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CoachModel from "@/models/Coach";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { coachId, amount, date, modeOfPayment } = await req.json();

    if (!coachId || !amount || !date) {
      return NextResponse.json({ success: false, error: "Missing fields" });
    }

    const coach = await CoachModel.findById(coachId);
    if (!coach)
      return NextResponse.json({ success: false, error: "Coach not found" });

    coach.salaryHistory.push({
      amountPaid: amount,
      paidOn: date,
      modeOfPayment: modeOfPayment || "Cash",
    });
    await coach.save();

    return NextResponse.json({ success: true, coach });
  } catch (err) {
    console.error("Error paying salary:", err);
    return NextResponse.json({
      success: false,
      error: (err as Error).message,
    });
  }
}
