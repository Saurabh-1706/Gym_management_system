import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";
import AttendanceReport from "@/components/pdf/AttendanceReport";

const getMockAttendanceRecord = (memberId: string, name: string) => {
  // Deterministic seed based on memberId character codes
  const seed = memberId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Total present days: 10 to 30
  const totalPresent = 10 + (seed % 21);
  // Total absent days: 0 to 15
  const totalAbsent = seed % 16;
  
  const totalDays = totalPresent + totalAbsent;
  const rate = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;

  return {
    memberName: name,
    totalPresent,
    totalAbsent,
    rate,
  };
};

export async function GET(req: Request) {
  try {
    const { tenantId, tenant } = await withTenantGuard(req);
    await connectToDatabase();

    const url = new URL(req.url);
    const fromParam = url.searchParams.get("from") || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0];
    const toParam = url.searchParams.get("to") || new Date().toISOString().split("T")[0];

    const members = await Member.find({ tenantId }).lean();

    const records = members.map((m: any) => 
      getMockAttendanceRecord(m._id.toString(), m.name)
    );

    // Sort by attendance rate ascending so low attendance members appear first
    records.sort((a, b) => a.rate - b.rate);

    const buffer = await renderToBuffer(
      React.createElement(AttendanceReport, {
        gymName: tenant.name,
        from: fromParam,
        to: toParam,
        records,
        generatedAt: new Date().toLocaleDateString("en-GB"),
      }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=attendance_report_${fromParam}_to_${toParam}.pdf`,
      },
    });
  } catch (error) {
    if (error instanceof TenantGuardError) return error.response;
    console.error("❌ Error generating attendance report:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
