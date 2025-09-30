import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";

// GET all members
// GET all members
// GET all members (with optional date filter for joinDate)
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let filter: any = {};
    if (from && to) {
      filter.joinDate = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const members = await Member.find(filter).sort({ joinDate: -1 });
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("❌ Error fetching members:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch members" },
      { status: 500 }
    );
  }
}


// POST new member
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const newMember = await Member.create({
      ...body,
      joinDate: body.joinDate ? new Date(body.joinDate) : new Date(), // ✅ set once (either provided or today)
      date: new Date(body.date), // ✅ payment date (first plan start date)
      price: Number(body.price),
      modeOfPayment: body.modeOfPayment || "Cash",
      payments: [
        {
          plan: body.plan,
          price: Number(body.price),
          date: new Date(body.date),
          modeOfPayment: body.modeOfPayment || "Cash",
        },
      ],
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error("❌ Error adding member:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add member" },
      { status: 500 }
    );
  }
}
