import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";

// ------------------
// Helper: Calculate Expiry Date
// ------------------
function calculateExpiryDate(member: any): Date {
  let baseDate: Date;
  let plan: string;

  if (member.payments?.length > 0) {
    // ✅ Sort payments by first installment date
  const latestPayment = [...member.payments].sort((a, b) => {
    const aStart = a.installments?.[0]?.paymentDate || 0;
    const bStart = b.installments?.[0]?.paymentDate || 0;
    return new Date(bStart).getTime() - new Date(aStart).getTime();
  })[0];

  // ✅ Always use the FIRST installment's date as plan start date
  baseDate = new Date(
    latestPayment.installments?.[0]?.paymentDate || member.date
  );
  plan = latestPayment.plan;


  } else {
    baseDate = new Date(member.date);
    plan = member.plan;
  }

  if (!plan) return baseDate;

  const match = plan.match(/(\d+)\s*(day|days|month|months|year|years)/i);
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
    switch (plan.toLowerCase()) {
      case "monthly":
      case "1 month":
        baseDate.setMonth(baseDate.getMonth() + 1);
        break;
      case "quarterly":
      case "3 months":
        baseDate.setMonth(baseDate.getMonth() + 3);
        break;
      case "half yearly":
      case "6 months":
        baseDate.setMonth(baseDate.getMonth() + 6);
        break;
      case "yearly":
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
// Determine member status (Active / Inactive)
// ------------------
function determineStatus(member: any): "Active" | "Inactive" {
  const expiryDate = calculateExpiryDate(member);
  const graceDate = new Date(expiryDate);
  graceDate.setDate(graceDate.getDate() + 7);

  return new Date() <= graceDate ? "Active" : "Inactive";
}

// ------------------
// GET: fetch single member
// ------------------
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const member = await Member.findById(params.id);
    if (!member)
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });

    member.status = determineStatus(member);
    await member.save(); // keep DB updated
    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error("❌ Error fetching member:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch member" }, { status: 500 });
  }
}

// ------------------
// PUT: update / renew / pay remaining
// ------------------
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const member = await Member.findById(params.id);
    if (!member)
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });

    // 1️⃣ Add new plan (Renew Membership)
    if (body.plan && body.actualAmount && body.amountPaid && body.modeOfPayment) {
      const newPayment = {
        plan: body.plan,
        actualAmount: Number(body.actualAmount),
        paymentStatus: Number(body.amountPaid) >= Number(body.actualAmount) ? "Paid" : "Unpaid",
        installments: [
          {
            amountPaid: Number(body.amountPaid),
            // ✅ Use joinDate as paymentDate if provided
            paymentDate: new Date(body.joinDate || body.date || Date.now()),
            dueDate:
              Number(body.amountPaid) >= Number(body.actualAmount)
                ? null
                : body.dueDate
                ? new Date(body.dueDate)
                : null,
            modeOfPayment: body.modeOfPayment,
          },
        ],
      };

      member.payments.push(newPayment);
      member.plan = body.plan;
      member.date = new Date(body.date || Date.now());
      member.status = "Active"; // Reactivate on renewal
    }

    // ✅ Update join date only when requested (from frontend)
    if (body.updateJoinDate && body.joinDate) {
      member.joinDate = new Date(body.joinDate);
    }

    // 2️⃣ Pay remaining amount
    if (body.paymentId && body.additionalInstallment) {
      const payment = member.payments.id(body.paymentId);
      if (payment) {
        payment.installments.push({
          amountPaid: Number(body.additionalInstallment.amountPaid),
          paymentDate: new Date(body.additionalInstallment.paymentDate || Date.now()),
          modeOfPayment: body.additionalInstallment.modeOfPayment || "Cash",
          dueDate: null,
        });

        // ✅ Sort installments so first payment always stays first
      payment.installments.sort(
        (a: any, b: any) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
      );

      // ✅ Make sure the plan start date (first payment) never changes
      const firstPaymentDate = payment.installments[0]?.paymentDate;
      if (firstPaymentDate) {
        // Only use this date for expiry calculation
        payment.planStartDate = new Date(firstPaymentDate);
      }


        const totalPaid = payment.installments.reduce(
          (sum: number, inst: any) => sum + inst.amountPaid,
          0
        );

        if (totalPaid >= payment.actualAmount) {
          payment.paymentStatus = "Paid";
          payment.installments = payment.installments.map((inst: any) => ({
            ...inst.toObject?.() || inst,
            dueDate: null,
          }));
        } else {
          payment.paymentStatus = "Unpaid";
        }
      }
    }

    // 3️⃣ Update editable fields
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
    if (!deleted)
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Member deleted successfully" });
  } catch (error) {
    console.error("❌ Delete member error:", error);
    return NextResponse.json({ success: false, message: "Failed to delete member" }, { status: 500 });
  }
}
