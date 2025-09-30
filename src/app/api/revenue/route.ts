import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Member from "@/models/Member";
import Coach from "@/models/Coach";
import ElectricityBill from "@/models/ElectricityBill";
import Miscellaneous from "@/models/Miscellaneous";

// Types
type Payment = {
  plan: string;
  price: number;
  date: Date;
  modeOfPayment: string;
  name?: string;
};

type Salary = {
  amountPaid: number;
  paidOn: Date;
  name?: string;
};

export async function GET() {
  try {
    await connectToDatabase();

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const miscMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const currentMonthName = today.toLocaleString("en-US", { month: "long" });
    const currentMonthYear = `${currentMonthName} ${currentYear}`;

    // --- Members ---
    const members = await Member.find({});
    const filteredMembers: Payment[] = members.flatMap((m) =>
      (m.payments || [])
        .filter((p: Payment) => {
          const d = new Date(p.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .map((p: Payment) => ({ ...p, name: m.name }))
    );

    // --- Coaches ---
    const coaches = await Coach.find({});
    const filteredCoaches: Salary[] = coaches.flatMap((c) =>
      (c.salaryHistory || [])
        .filter((s: Salary) => {
          const d = new Date(s.paidOn);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .map((s: Salary) => ({ ...s, name: c.name }))
    );

    // --- Miscellaneous ---
    const misc = await Miscellaneous.find({ date: miscMonthKey });

    // --- Electricity ---
    const electricity = await ElectricityBill.find({ month: currentMonthYear });

    // --- Totals ---
    const totalMembership = filteredMembers.reduce((sum, p) => sum + (p.price || 0), 0);
    const totalCoachSalary = filteredCoaches.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
    const totalMisc = misc.reduce((sum, m) => sum + (m.amount || 0), 0);
    const totalElectricity = electricity.reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalRevenue = totalMembership - (totalCoachSalary + totalMisc + totalElectricity);

    return NextResponse.json({
      members: filteredMembers,
      coaches: filteredCoaches,
      miscellaneous: misc,
      electricity,
      totals: { totalMembership, totalCoachSalary, totalMisc, totalElectricity, totalRevenue },
    });
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}
