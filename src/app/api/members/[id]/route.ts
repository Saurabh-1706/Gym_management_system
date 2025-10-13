import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";

// ------------------
// Helper: Calculate expiry date based on latest plan/payment
// ------------------
function calculateExpiryDate(member: any): Date {
  let baseDate: Date;
  let plan: string;

  if (member.payments?.length) {
    const latestPayment = [...member.payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    baseDate = new Date(latestPayment.date);
    plan = latestPayment.plan;
  } else {
    baseDate = new Date(member.date);
    plan = member.plan;
  }

  if (!plan) return baseDate;

  // Handle custom format like "Custom(30 days)" or "3 months"
  const match = plan.match(/(?:Custom\()?(\d+)\s*(day|days|month|months|year|years)\)?/i);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
      case "day":
      case "days":
        baseDate.setDate(baseDate.getDate() + value);
        break;
      case "month":
      case "months":
        baseDate.setMonth(baseDate.getMonth() + value);
        break;
      case "year":
      case "years":
        baseDate.setFullYear(baseDate.getFullYear() + value);
        break;
    }
  } else {
    // Fallback for default plan names
    switch (plan.toLowerCase()) {
      case "monthly":
      case "1 month":
      case "1 months":
        baseDate.setMonth(baseDate.getMonth() + 1);
        break;
      case "quarterly":
      case "3 months":
      case "3 month":
        baseDate.setMonth(baseDate.getMonth() + 3);
        break;
      case "half yearly":
      case "6 month":
      case "6 months":
        baseDate.setMonth(baseDate.getMonth() + 6);
        break;
      case "yearly":
      case "1 year":
      case "12 months":
        baseDate.setFullYear(baseDate.getFullYear() + 1);
        break;
      default:
        baseDate.setMonth(baseDate.getMonth() + 1);
    }
  }

  return baseDate;
}

// ------------------
// Determine status with 7-day grace period
// ------------------
function determineStatus(member: any): "Active" | "Inactive" {
  const expiry = calculateExpiryDate(member);
  const graceDate = new Date(expiry);
  graceDate.setDate(graceDate.getDate() + 7); // 7-day grace
  return graceDate >= new Date() ? "Active" : "Inactive";
}

// ------------------
// GET: fetch single member
// ------------------
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const member = await Member.findById(params.id);
    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    member.status = determineStatus(member);
    await member.save();

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("❌ Error fetching member:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch member" }, { status: 500 });
  }
}

// ------------------
// PUT: edit or renew member
// ------------------
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const member = await Member.findById(params.id);
    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    // Handle Renewal
    if (body.plan && body.price && body.date && body.modeOfPayment) {
      member.payments.push({
        plan: body.plan,
        price: Number(body.price),
        date: new Date(body.date),
        modeOfPayment: body.modeOfPayment || "Cash",
      });

      member.plan = body.plan;
      member.date = new Date(body.date);
    }

    // Handle General Edit (including profilePicture and dob)
    const editableFields = ["name", "mobile", "email", "profilePicture", "dob"];
    editableFields.forEach((field) => {
      if (body[field] !== undefined) {
        member[field] = field === "dob" ? new Date(body[field]) : body[field];
      }
    });

    member.status = determineStatus(member);
    await member.save();

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("❌ Error updating member:", error);
    return NextResponse.json({ success: false, message: "Failed to update member" }, { status: 500 });
  }
}

// ------------------
// DELETE: delete member
// ------------------
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const deleted = await Member.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    console.error("❌ Delete member error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete member" }, { status: 500 });
  }
}
