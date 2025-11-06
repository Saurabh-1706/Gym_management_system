import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";

// --------------------
// GET all members (with optional date filter)
// --------------------
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const filter: Record<string, any> = {};
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


export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, mobile, email, dob, date, profilePicture } = body;

    if (!name || !mobile || !dob || !date) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, mobile, date of birth, and join date are required.",
        },
        { status: 400 }
      );
    }

    // ✅ Directly use UTC dates from frontend (no timezone reset)
    const dobDate = new Date(dob);
    const joinDate = new Date(date);

    // ✅ Duplicate check using mobile + dob (date only)
    const nextDay = new Date(dobDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const existingMember = await Member.findOne({
      mobile,
      dob: { $gte: dobDate, $lt: nextDay },
    });

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Member with same mobile number and date of birth already exists.",
        },
        { status: 400 }
      );
    }

    // ✅ Create new member using provided joinDate (exact date)
    const newMember = await Member.create({
      name,
      mobile,
      email,
      dob: dobDate,
      joinDate,
      profilePicture: profilePicture || "",
      plan: "No Plan",
      status: "Inactive",
      payments: [],
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error("❌ Error adding member:", error);
    return NextResponse.json(
      { success: false, message: "Failed to register member" },
      { status: 500 }
    );
  }
}

