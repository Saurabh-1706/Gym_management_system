import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";
import MemberReport from "@/components/pdf/MemberReport";

function calculateExpiryDate(member: any): Date {
  let baseDate: Date;
  let plan: string;

  if (member.payments?.length > 0) {
    const latestPayment = [...member.payments].sort((a, b) => {
      const aStart = a.installments?.[0]?.paymentDate || 0;
      const bStart = b.installments?.[0]?.paymentDate || 0;
      return new Date(bStart).getTime() - new Date(aStart).getTime();
    })[0];

    baseDate = new Date(
      latestPayment.installments?.[0]?.paymentDate || member.date || member.joinDate
    );
    plan = latestPayment.plan;
  } else {
    baseDate = new Date(member.date || member.joinDate);
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
        baseDate.setMonth(baseDate.setMonth(baseDate.getMonth() + value));
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

function determineStatus(member: any): "Active" | "Inactive" {
  const expiryDate = calculateExpiryDate(member);
  const graceDate = new Date(expiryDate);
  graceDate.setDate(graceDate.getDate() + 7);
  return new Date() <= graceDate ? "Active" : "Inactive";
}

const getMockAttendance = (memberId: string) => {
  const sum = memberId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const totalDays = 15 + (sum % 15);
  const presentThisMonth = 5 + (sum % 10);
  const streak = 2 + (sum % 6);
  return { totalDays, presentThisMonth, streak };
};

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, tenant } = await withTenantGuard(req);
    await connectToDatabase();

    const { id } = await props.params;
    const member = await Member.findOne({ _id: id, tenantId }).lean() as any;
    if (!member) {
      return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 });
    }

    const status = determineStatus(member);

    // Format for MemberReport
    const reportMember = {
      name: member.name,
      email: member.email,
      mobile: member.mobile,
      joinDate: new Date(member.joinDate || member.date || Date.now()).toLocaleDateString("en-GB"),
      plan: member.plan || "No Plan",
      status,
      attendance: getMockAttendance(id),
      payments: (member.payments || []).map((p: any) => ({
        date: new Date(p.createdAt || Date.now()).toLocaleDateString("en-GB"),
        amount: p.totalPaid || p.actualAmount || 0,
        plan: p.plan || "N/A",
        status: p.paymentStatus || "Paid",
      })),
    };

    const buffer = await renderToBuffer(
      React.createElement(MemberReport, {
        gymName: tenant.name,
        member: reportMember,
        generatedAt: new Date().toLocaleDateString("en-GB"),
      }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=member_${member.name.replace(/\s+/g, "_")}_report.pdf`,
      },
    });
  } catch (error) {
    if (error instanceof TenantGuardError) return error.response;
    console.error("❌ Error generating member report:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
