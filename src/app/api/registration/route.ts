import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

// Payment sub-schema
const paymentSchema = new mongoose.Schema(
  {
    plan: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true },
    modeOfPayment: { type: String, required: true },
  },
  { _id: false }
);

// Member schema (include dob)
const memberSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  plan: String,
  date: Date,
  price: Number,
  expiryDate: Date,
  dob: { type: Date, required: true }, // ✅ new field
  payments: { type: [paymentSchema], default: [] },
  status: { type: String, default: "Active" },
});

const Member = mongoose.models.Member || mongoose.model("Member", memberSchema);

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      date,
      plan,
      customValidity,
      customUnit,
      price,
      modeOfPayment,
      mobile,
      dob, // ✅ from frontend
    } = body;

    // ✅ Check if a member with same mobile & dob already exists
    const existingMember = await Member.findOne({
      mobile,
      dob: new Date(dob),
    });

    if (existingMember) {
      return NextResponse.json({
        success: false,
        error: "Member with same mobile number and date of birth already exists.",
      });
    }

    // Calculate expiry date
    let finalPlan = plan;
    let joinDate = new Date(date);
    let expiryDate = new Date(joinDate);

    if (plan.toLowerCase() === "custom" && customValidity && customUnit) {
      finalPlan = `Custom(${customValidity} ${customUnit})`;

      if (customUnit.toLowerCase() === "days") {
        expiryDate.setDate(expiryDate.getDate() + parseInt(customValidity, 10));
      } else if (customUnit.toLowerCase() === "months") {
        expiryDate.setMonth(expiryDate.getMonth() + parseInt(customValidity, 10));
      }
    } else {
      switch (plan.toLowerCase()) {
        case "monthly":
        case "1 month":
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          break;
        case "quarterly":
        case "3 months":
          expiryDate.setMonth(expiryDate.getMonth() + 3);
          break;
        case "half yearly":
        case "6 months":
          expiryDate.setMonth(expiryDate.getMonth() + 6);
          break;
        case "yearly":
        case "12 months":
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          break;
        default:
          expiryDate.setMonth(expiryDate.getMonth() + 1);
      }
    }

    // Payment record
    const initialPayment = {
      plan: finalPlan,
      price: Number(price),
      date: joinDate,
      modeOfPayment: modeOfPayment || "Cash",
    };

    const status = expiryDate >= new Date() ? "Active" : "Inactive";

    // ✅ Save member with dob
    const newMember = new Member({
      ...body,
      plan: finalPlan,
      date: joinDate,
      price: Number(price),
      payments: [initialPayment],
      expiryDate,
      status,
      dob: new Date(dob),
    });

    await newMember.save();

    return NextResponse.json({ success: true, member: newMember });
  } catch (error) {
    console.error("❌ Registration error:", error);
    return NextResponse.json({ success: false, error: "Failed to register" });
  }
}
