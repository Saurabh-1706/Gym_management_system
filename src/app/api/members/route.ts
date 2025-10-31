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

// --------------------
// POST new member (registration only – no plan/payment)
// --------------------
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, mobile, email, dob, profilePicture } = body;

    if (!name || !mobile || !dob) {
      return NextResponse.json(
        { success: false, message: "Name, mobile, and date of birth are required." },
        { status: 400 }
      );
    }

    // ✅ Duplicate check using mobile + dob (date only)
    const dobDate = new Date(dob);
    const nextDay = new Date(dobDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingMember = await Member.findOne({
      mobile,
      dob: { $gte: dobDate, $lt: nextDay },
    });

    if (existingMember) {
      return NextResponse.json(
        { success: false, message: "Member with same mobile number and date of birth already exists." },
        { status: 400 }
      );
    }

    // ✅ Create a new member (Inactive by default, with defaults)
    const newMember = await Member.create({
      name,
      mobile,
      email,
      dob: new Date(dob),
      profilePicture: profilePicture || "",
      plan: "No Plan", // 🟢 default value (prevents undefined errors)
      joinDate: new Date(), // 🟢 store current join date
      status: "Inactive", // 🟢 not active until plan/payment added
      payments: [], // 🟢 empty until plan/payment is added
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
