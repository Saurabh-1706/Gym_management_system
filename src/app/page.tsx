"use client";

import { useEffect, useState } from "react";
import {
  User,
  CreditCard,
  Calendar,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Loader from "@/components/Loader";

type Installment = {
  amountPaid: number;
  paymentDate: string;
  dueDate?: string;
  modeOfPayment?: string;
};

type Payment = {
  price?: number;
  date: string;
  plan?: string;
  paymentStatus?: string;
  installments?: Installment[];
  actualAmount?: number;
};

type Member = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  dob?: string;
  joinDate?: string; // ✅ added
  date?: string;
  plan: string;
  status?: string;
  payments?: Payment[];
};

type Salary = {
  _id: string;
  amountPaid: number;
  paidOn: string;
};

type Coach = {
  _id: string;
  name: string;
  salaryHistory?: Salary[];
};

type MiscCost = {
  _id: string;
  name: string;
  date: string;
  amount: number;
};

type ElectricityBill = {
  _id: string;
  month: string;
  year: number;
  amount: number;
  date: string;
};

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [overdueMembers, setOverdueMembers] = useState<any[]>([]);
  const [showOverdue, setShowOverdue] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const getLatestJoinDate = (member: Member) => {
    try {
      if (member.payments && member.payments.length > 0) {
        const paymentDate =
          member.payments[member.payments.length - 1].date || "";
        const parsed = new Date(paymentDate);
        return isNaN(parsed.getTime())
          ? new Date(member.joinDate || member.date || new Date().toISOString())
          : parsed;
      }

      const parsedJoin = new Date(
        member.joinDate || member.date || new Date().toISOString()
      );
      return isNaN(parsedJoin.getTime()) ? new Date() : parsedJoin;
    } catch {
      return new Date();
    }
  };

  const calculateExpiryDateObj = (joinDate: string, plan: string) => {
    const date = new Date(joinDate);
    const match = plan.match(/(\d+)\s*(day|days|month|months|year|years)/i);

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case "day":
        case "days":
          date.setDate(date.getDate() + value);
          break;
        case "month":
        case "months":
          date.setMonth(date.getMonth() + value);
          break;
        case "year":
        case "years":
          date.setFullYear(date.getFullYear() + value);
          break;
      }
      return date;
    }

    switch (plan.toLowerCase()) {
      case "monthly":
      case "1 month":
      case "1 months":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
      case "3 months":
      case "3 month":
        date.setMonth(date.getMonth() + 3);
        break;
      case "half yearly":
      case "6 months":
      case "6 month":
        date.setMonth(date.getMonth() + 6);
        break;
      case "yearly":
      case "1 year":
      case "12 months":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date;
  };

  const calculateExpiryDate = (joinDate: string, plan: string) =>
    calculateExpiryDateObj(joinDate, plan).toLocaleDateString("en-GB");

  const today = new Date();

  const hasOverdueInstallment = (member: Member) => {
    if (!member.payments) return false;
    const now = new Date();
    for (const payment of member.payments) {
      if (payment.paymentStatus !== "Paid" && payment.installments?.length) {
        for (const inst of payment.installments) {
          if (inst.dueDate && new Date(inst.dueDate) < now) return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        const data = await res.json();
        if (Array.isArray(data.members)) {
          const sortedMembers = data.members.sort((a: Member, b: Member) =>
            a.name.localeCompare(b.name)
          );
          setMembers(sortedMembers);
          setAllMembers(sortedMembers);

          const now = new Date();
          const overdueList = sortedMembers
            .map((m: Member) => {
              if (!m.payments) return null;
              for (const payment of m.payments) {
                if (
                  payment.paymentStatus !== "Paid" &&
                  payment.installments?.length
                ) {
                  for (const inst of payment.installments) {
                    if (inst.dueDate && new Date(inst.dueDate) < now) {
                      return { ...m, overdueDate: inst.dueDate };
                    }
                  }
                }
              }
              return null;
            })
            .filter(Boolean);

          setOverdueMembers(overdueList);
          setOverdueCount(overdueList.length);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };

    const fetchRevenueData = async () => {
      try {
        const [memberRes, coachRes, miscRes, elecRes] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/coach"),
          fetch("/api/miscellaneous"),
          fetch("/api/electricity-bill"),
        ]);

        const memberData = await memberRes.json();
        const coachData = await coachRes.json();
        const miscData = await miscRes.json();
        const elecData = await elecRes.json();

        const now = new Date();
        const isCurrentMonth = (dateString: string | Date) => {
          const date = new Date(dateString);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        };

        const filteredMembers = (memberData.members || [])
          .map((m: Member) => ({
            ...m,
            payments: m.payments?.filter((p) => isCurrentMonth(p.date)),
          }))
          .filter((m: Member) => m.payments && m.payments.length > 0);

        const totalMemberRevenue = filteredMembers.reduce(
          (acc: number, m: Member) =>
            acc +
            m.payments!.reduce(
              (sum: number, p: Payment) => sum + (p.price || 0),
              0
            ),
          0
        );

        const filteredCoaches = (coachData.coaches || [])
          .map((c: Coach) => ({
            ...c,
            salaryHistory: c.salaryHistory?.filter((s) =>
              isCurrentMonth(s.paidOn)
            ),
          }))
          .filter((c: Coach) => c.salaryHistory && c.salaryHistory.length > 0);

        const totalCoachSalary = filteredCoaches.reduce(
          (acc: number, c: Coach) =>
            acc +
            c.salaryHistory!.reduce(
              (sum: number, s: Salary) => sum + (s.amountPaid || 0),
              0
            ),
          0
        );

        const totalMisc = (miscData.costs || [])
          .filter((m: MiscCost) => isCurrentMonth(m.date))
          .reduce((acc: number, m: MiscCost) => acc + m.amount, 0);

        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const filteredElectricity = (elecData.bills || []).filter(
          (e: ElectricityBill) =>
            monthNames.indexOf(e.month) === now.getMonth() &&
            e.year === now.getFullYear()
        );
        const totalElectricity = filteredElectricity.reduce(
          (acc: number, e: ElectricityBill) => acc + e.amount,
          0
        );

        setTotalRevenue(
          totalMemberRevenue - totalCoachSalary - totalMisc - totalElectricity
        );
      } catch (err) {
        console.error("Failed to fetch revenue data:", err);
      }
    };

    fetchMembers();
    fetchRevenueData();
  }, []);

  const totalMembers = allMembers.length;

  if (status === "loading") {
    return <Loader text="Loading Dashboard Data..." />;
  }

  if (!session) return null;

  return (
    <div className="p-6 bg-[#E9ECEF] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sliders size={36} className="text-[#FFC107]" />
        <h1 className="text-4xl font-bold text-[#212529]">Admin Panel</h1>
      </div>

      {/* ✅ Overdue Notification */}
      {overdueCount > 0 && (
        <div
          onClick={() => setShowOverdue((prev) => !prev)}
          className={`cursor-pointer transition-all duration-300 ${
            showOverdue ? "bg-red-200" : "bg-red-100"
          } border border-red-400 text-red-800 rounded-2xl px-6 py-5 mb-10 shadow-md hover:bg-red-200`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={28} className="text-red-600" />
            <span className="text-xl font-bold">
              {overdueCount} member
              {overdueCount > 1 ? "s have" : " has"} overdue installment
              {overdueCount > 1 ? "s" : ""}!
            </span>
          </div>

          {showOverdue && overdueMembers.length > 0 && (
            <div className="mt-5 overflow-x-auto bg-white rounded-2xl shadow-lg p-6 transition-all duration-300">
              <h3 className="text-2xl font-bold text-[#212529] mb-4">
                Overdue Installments
              </h3>
              <table className="min-w-full divide-y divide-gray-300 rounded-2xl overflow-hidden">
                <thead className="bg-[#0A2463] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Name</th>
                    <th className="px-6 py-4 text-left">Mobile</th>
                    <th className="px-6 py-4 text-left">Plan</th>
                    <th className="px-6 py-4 text-left">Due Date</th>
                    <th className="px-6 py-4 text-right">Pending Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueMembers.map((m, idx) => {
                    let pendingAmount = 0;
                    if (m.payments?.length) {
                      const unpaid = m.payments.filter(
                        (p: any) => p.paymentStatus !== "Paid"
                      );
                      unpaid.forEach((p: any) => {
                        const totalPaid = (p.installments || []).reduce(
                          (sum: number, inst: any) =>
                            sum + (inst.amountPaid || 0),
                          0
                        );
                        if (p.price || p.actualAmount)
                          pendingAmount +=
                            (p.price || p.actualAmount) - totalPaid;
                      });
                    }
                    return (
                      <tr
                        key={m._id}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-[#DEE2E6]"
                        } hover:bg-red-100/50 cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/members/${m._id}`);
                        }}
                      >
                        <td className="px-6 py-4 font-semibold">{m.name}</td>
                        <td className="px-6 py-4">{m.mobile}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full bg-[#FFC107]/20 font-semibold">
                            {m.plan || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {m.overdueDate
                            ? new Date(m.overdueDate || "").toLocaleDateString(
                                "en-GB"
                              )
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          ₹{pendingAmount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-10">
        {/* Total Members */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/members")}
        >
          <User size={40} className="text-[#FFC107]" />
          <div>
            <p className="text-lg text-[#212529]">Total Members</p>
            <p className="text-2xl font-bold text-[#212529]">{totalMembers}</p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/expiringsoon")}
        >
          <Calendar size={40} className="text-orange-500" />
          <div>
            <p className="text-lg text-[#212529]">Expiring Soon</p>
            <p className="text-2xl font-bold text-[#212529]">
              {
                allMembers.filter((m: Member) => {
                  if (!m.payments || m.payments.length === 0) return false;

                  // 🔹 Find latest renewal date (last installment or createdAt)
                  const latestPayment = [...m.payments].sort((a, b) => {
                    const aDate =
                      a.installments?.[a.installments.length - 1]
                        ?.paymentDate ||
                      a.date ||
                      "";
                    const bDate =
                      b.installments?.[b.installments.length - 1]
                        ?.paymentDate ||
                      b.date ||
                      "";
                    return (
                      new Date(bDate).getTime() - new Date(aDate).getTime()
                    );
                  })[0];

                  if (!latestPayment) return false;

                  const renewalDate =
                    latestPayment.installments?.length &&
                    latestPayment.installments?.length > 0
                      ? latestPayment.installments[
                          latestPayment.installments.length - 1
                        ]?.paymentDate
                      : latestPayment.date;

                  if (!renewalDate) return false;

                  const planToCheck = latestPayment.plan || m.plan;
                  const expiry = calculateExpiryDateObj(
                    renewalDate,
                    planToCheck
                  );

                  return (
                    expiry >= today &&
                    expiry <=
                      new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                  );
                }).length
              }
            </p>
          </div>
        </div>

        {/* Expired Memberships */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/expiredmembers")}
        >
          <Calendar size={40} className="text-red-500" />
          <div>
            <p className="text-lg text-[#212529]">Expired Memberships</p>
            <p className="text-2xl font-bold text-[#212529]">
              {
                allMembers.filter((m: Member) => {
                  if (!m.payments || m.payments.length === 0) return false;

                  // 🔹 Find latest renewal date
                  const latestPayment = [...m.payments].sort((a, b) => {
                    const aDate =
                      a.installments?.[a.installments.length - 1]
                        ?.paymentDate ||
                      a.date ||
                      "";
                    const bDate =
                      b.installments?.[b.installments.length - 1]
                        ?.paymentDate ||
                      b.date ||
                      "";
                    return (
                      new Date(bDate).getTime() - new Date(aDate).getTime()
                    );
                  })[0];

                  if (!latestPayment) return false;

                  const renewalDate =
                    latestPayment.installments?.length &&
                    latestPayment.installments?.length > 0
                      ? latestPayment.installments[
                          latestPayment.installments.length - 1
                        ]?.paymentDate
                      : latestPayment.date;

                  if (!renewalDate) return false;

                  const planToCheck = latestPayment.plan || m.plan;
                  const expiry = calculateExpiryDateObj(
                    renewalDate,
                    planToCheck
                  );

                  return expiry < today;
                }).length
              }
            </p>
          </div>
        </div>

        {/* Membership */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/revenue")}
        >
          <CreditCard size={40} className="text-green-600" />
          <div>
            <p className="text-lg text-[#212529]">Membership</p>
            <p className="text-2xl font-bold text-[#212529]">
              ₹
              {allMembers
                .reduce((acc, m) => {
                  if (!m.payments) return acc;

                  const currentMonth = new Date().getMonth();
                  const currentYear = new Date().getFullYear();

                  // ✅ Sum all payments made in the current month
                  const monthPayments = m.payments.reduce((sum, p) => {
                    const paymentDate = new Date(p.date);
                    const isThisMonth =
                      paymentDate.getMonth() === currentMonth &&
                      paymentDate.getFullYear() === currentYear;

                    let monthlyInstallmentsTotal = 0;

                    // ✅ Include installments paid this month
                    if (p.installments && p.installments.length > 0) {
                      monthlyInstallmentsTotal = p.installments.reduce(
                        (instSum, inst) => {
                          const instDate = new Date(inst.paymentDate);
                          const isInstThisMonth =
                            instDate.getMonth() === currentMonth &&
                            instDate.getFullYear() === currentYear;
                          return (
                            instSum +
                            (isInstThisMonth ? inst.amountPaid || 0 : 0)
                          );
                        },
                        0
                      );
                    }

                    // ✅ Include one-time payment if it’s in the same month
                    if (isThisMonth) {
                      return sum + (p.price || 0) + monthlyInstallmentsTotal;
                    }

                    return sum + monthlyInstallmentsTotal;
                  }, 0);

                  return acc + monthPayments;
                }, 0)
                .toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Members Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-[#212529] mb-4">
          Recent Members
        </h2>
        <table className="min-w-full divide-y divide-gray-300 rounded-2xl overflow-hidden">
          <thead className="bg-[#0A2463] text-white">
            <tr>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Date Joined
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Expire On
              </th>
            </tr>
          </thead>
          <tbody>
            {members
              .sort(
                (a, b) =>
                  new Date(b.date || "").getTime() -
                  new Date(a.date || "").getTime()
              )
              .slice(0, 7)
              .map((member: Member, idx: number) => (
                <tr
                  key={member._id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-[#DEE2E6]"
                  } hover:bg-[#FFC107]/20 transition-colors`}
                >
                  <td className="px-6 py-4 font-semibold text-[#212529]">
                    {member.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-[#FFC107]/20 text-[#212529] font-semibold text-base">
                      {member.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#212529]">{member.mobile}</td>
                  <td className="px-6 py-4 text-[#212529]">
                    {new Date(
                      member.joinDate || member.date || new Date().toISOString()
                    ).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-[#212529] font-semibold">
                    {calculateExpiryDate(
                      member.joinDate ||
                        member.date ||
                        new Date().toISOString(),
                      member.plan || "1 month"
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <p className="text-gray-500 mt-4 text-center">No recent members.</p>
        )}
      </div>
    </div>
  );
}
