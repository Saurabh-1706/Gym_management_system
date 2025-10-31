import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member"; // ✅ use your centralized model

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, mobile, email, dob, profilePicture } = body;

    // Validate required fields
    if (!name || !mobile || !dob) {
      return NextResponse.json({
        success: false,
        error: "Name, mobile, and date of birth are required.",
      });
    }

    // ✅ Check for existing member (ignore time in dob)
    const dobDate = new Date(dob);
    const nextDay = new Date(dobDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const existingMember = await Member.findOne({
      mobile,
      dob: { $gte: dobDate, $lt: nextDay },
    });

    if (existingMember) {
      return NextResponse.json({
        success: false,
        error:
          "Member with the same mobile number and date of birth already exists.",
      });
    }

    // ✅ Create new member (without plan or payments)
    const newMember = new Member({
      name,
      mobile,
      email,
      dob: new Date(dob),
      profilePicture: profilePicture || "",
      plan: null,
      status: "Inactive", // not active until a plan/payment is added
      payments: [],
    });

    await newMember.save();

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to register member.",
    });
  }
}
