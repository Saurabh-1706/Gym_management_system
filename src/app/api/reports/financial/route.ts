import { NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";
import Coach from "@/models/Coach";
import Miscellaneous from "@/models/Miscellaneous";
import ElectricityBill from "@/models/ElectricityBill";
import { withTenantGuard, TenantGuardError } from "@/lib/tenantGuard";
import FinancialReport from "@/components/pdf/FinancialReport";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export async function GET(req: Request) {
  try {
    const { tenantId, tenant } = await withTenantGuard(req);
    await connectToDatabase();

    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");
    const yearParam = url.searchParams.get("year");
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;
    let monthLabel = "";
    let yearLabel = "";

    if (fromParam && toParam) {
      startDate = new Date(fromParam);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toParam);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = `${fromParam} to ${toParam}`;
      monthLabel = "Custom";
      yearLabel = "Range";
    } else {
      const now = new Date();
      const month = monthParam !== null ? parseInt(monthParam, 10) : now.getMonth();
      const year = yearParam !== null ? parseInt(yearParam, 10) : now.getFullYear();

      startDate = new Date(year, month, 1, 0, 0, 0, 0);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      periodLabel = `${monthNames[month]} ${year}`;
      monthLabel = monthNames[month];
      yearLabel = year.toString();
    }

    // 1. Fetch Members & filter payments
    const members = await Member.find({ tenantId }).lean();
    
    // Member Payments in date range
    const memberPaymentsList: any[] = [];
    let totalMemberRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    const now = new Date();

    members.forEach((m: any) => {
      let hasTransactionsInPeriod = false;
      let memberStatus = "Paid";

      (m.payments || []).forEach((p: any) => {
        const installmentsInPeriod = (p.installments || []).filter((inst: any) => {
          const instDate = new Date(inst.paymentDate);
          return instDate >= startDate && instDate <= endDate;
        });

        if (installmentsInPeriod.length > 0) {
          hasTransactionsInPeriod = true;
          const amtPaidInPeriod = installmentsInPeriod.reduce((sum: number, inst: any) => sum + (inst.amountPaid || 0), 0);
          totalMemberRevenue += amtPaidInPeriod;

          memberPaymentsList.push({
            memberName: m.name,
            plan: p.plan || "N/A",
            amount: amtPaidInPeriod,
            date: new Date(installmentsInPeriod[0].paymentDate).toLocaleDateString("en-GB"),
            status: p.paymentStatus || "Paid",
          });

          if (p.paymentStatus === "Unpaid") {
            memberStatus = "Unpaid";
            pendingCount++;
            
            // Check if overdue
            const hasOverdueDate = p.installments?.some((inst: any) => inst.dueDate && new Date(inst.dueDate) < now);
            if (hasOverdueDate) {
              overdueCount++;
            }
          } else {
            paidCount++;
          }
        }
      });
    });

    // 2. Fetch Coaches & filter salaries
    const coaches = await Coach.find({ tenantId }).lean();
    let totalCoachSalary = 0;
    coaches.forEach((c: any) => {
      (c.salaryHistory || []).forEach((s: any) => {
        const paidDate = new Date(s.paidOn);
        if (paidDate >= startDate && paidDate <= endDate) {
          totalCoachSalary += s.amountPaid || 0;
        }
      });
    });

    // 3. Fetch Miscellaneous Costs in date range
    // Miscellaneous schema stores month-year as string "YYYY-MM"
    const miscCosts = await Miscellaneous.find({ tenantId }).lean();
    let totalMisc = 0;
    miscCosts.forEach((mc: any) => {
      // Parse YYYY-MM
      const [yStr, mStr] = mc.date.split("-");
      if (yStr && mStr) {
        const mcDate = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 15);
        if (mcDate >= startDate && mcDate <= endDate) {
          totalMisc += mc.amount || 0;
        }
      }
    });

    // 4. Fetch Electricity Bills in date range
    const electricityBills = await ElectricityBill.find({ tenantId }).lean();
    let totalElectricity = 0;
    electricityBills.forEach((eb: any) => {
      const monthIdx = monthNames.indexOf(eb.month);
      if (monthIdx !== -1) {
        const ebDate = new Date(eb.year, monthIdx, 15);
        if (ebDate >= startDate && ebDate <= endDate) {
          totalElectricity += eb.amount || 0;
        }
      }
    });

    const totalRevenue = totalMemberRevenue - totalCoachSalary - totalMisc - totalElectricity;

    const summary = {
      totalRevenue,
      paidCount,
      pendingCount,
      overdueCount,
      categoryTotals: {
        membership: totalMemberRevenue,
        coachSalaries: totalCoachSalary,
        expenses: totalMisc + totalElectricity,
      },
    };

    const buffer = await renderToBuffer(
      React.createElement(FinancialReport, {
        gymName: tenant.name,
        month: monthLabel,
        year: yearLabel,
        summary,
        transactions: memberPaymentsList,
        generatedAt: new Date().toLocaleDateString("en-GB"),
      }) as any
    );

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=financial_report_${periodLabel.replace(/\s+/g, "_")}.pdf`,
      },
    });
  } catch (error) {
    if (error instanceof TenantGuardError) return error.response;
    console.error("❌ Error generating financial report:", error);
    return NextResponse.json({ success: false, error: "Failed to generate report" }, { status: 500 });
  }
}
