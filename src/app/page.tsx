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

// ---- types stay the same ----
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
  joinDate?: string;
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

type Plan = {
  _id: string;
  name: string;
  validity: number;
  validityType: string; // "days" | "months"
};

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueMembers, setOverdueMembers] = useState<any[]>([]);
  const [showOverdue, setShowOverdue] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );
  const endOf7Days = new Date(
    startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1
  );

  // ------- expiry logic (unchanged) -------
  const calculateExpiryDate = (member: Member) => {
    if (!member.date && !member.joinDate) return null;

    const latestPayment =
      member.payments && member.payments.length > 0
        ? [...member.payments].sort(
            (a, b) =>
              new Date(
                b.installments?.[b.installments.length - 1]?.paymentDate || 0
              ).getTime() -
              new Date(
                a.installments?.[a.installments.length - 1]?.paymentDate || 0
              ).getTime()
          )[0]
        : null;

    const planStr = latestPayment?.plan || member.plan;
    const startDate = latestPayment
      ? new Date(
          latestPayment.installments?.[0]?.paymentDate ||
            member.date ||
            member.joinDate!
        )
      : new Date(member.date || member.joinDate!);

    if (Number.isNaN(startDate.getTime())) return null;

    const expiryDate = new Date(startDate);

    if (!planStr) return expiryDate;

    const customMatch = planStr.match(
      /Custom\((\d+)\s*(day|days|month|months|year|years)\)/i
    );

    if (customMatch) {
      const value = parseInt(customMatch[1], 10);
      const unit = customMatch[2].toLowerCase();
      switch (unit) {
        case "day":
        case "days":
          expiryDate.setDate(expiryDate.getDate() + value - 1);
          break;
        case "month":
        case "months":
          expiryDate.setMonth(expiryDate.getMonth() + value);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;
        case "year":
        case "years":
          expiryDate.setFullYear(expiryDate.getFullYear() + value);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;
      }
      return expiryDate;
    }

    const dbPlan = allPlans.find(
      (p) => p.name.toLowerCase() === planStr.toLowerCase()
    );

    if (dbPlan && dbPlan.validity > 0) {
      switch (dbPlan.validityType) {
        case "days":
          expiryDate.setDate(expiryDate.getDate() + dbPlan.validity - 1);
          break;
        case "months":
          expiryDate.setMonth(expiryDate.getMonth() + dbPlan.validity);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;
        default:
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          expiryDate.setDate(expiryDate.getDate() - 1);
      }
      return expiryDate;
    }

    expiryDate.setMonth(expiryDate.getMonth() + 1);
    expiryDate.setDate(expiryDate.getDate() - 1);
    return expiryDate;
  };

  // ------- data fetch (unchanged) -------
  useEffect(() => {
    const fetchMembersAndPlans = async () => {
      try {
        const [membersRes, plansRes] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/plans"),
        ]);

        const membersData = await membersRes.json();
        const plansData = await plansRes.json();

        const sortedMembers: Member[] = Array.isArray(membersData.members)
          ? membersData.members.sort((a: Member, b: Member) =>
              a.name.localeCompare(b.name)
            )
          : [];

        setMembers(sortedMembers);
        setAllMembers(sortedMembers);

        const plansArray: Plan[] = Array.isArray(plansData.plans)
          ? plansData.plans
          : [];
        setAllPlans(plansArray);

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
          .filter(Boolean) as any[];

        setOverdueMembers(overdueList);
        setOverdueCount(overdueList.length);
      } catch (error) {
        console.error("Failed to fetch members/plans:", error);
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

    fetchMembersAndPlans();
    fetchRevenueData();
  }, []);

  const totalMembers = allMembers.length;

  if (status === "loading") {
    return <Loader text="Loading Dashboard Data..." />;
  }

  if (!session) return null;

  return (
    <div className="dashboard-body min-h-screen bg-[#F5F7FB]">
      {/* 🔹 Mobile: no side padding, Desktop: small padding */}
      <div className="w-full px-0 sm:px-3 lg:px-6 py-4">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3 sm:px-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FFC107] to-[#ff8a00] text-white shadow-[0_10px_20px_rgba(0,0,0,0.15)]">
              <Sliders size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#212529]">
                Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm lg:text-base text-[#6C757D]">
                Quick overview of gym performance and members.
              </p>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="main-card rounded-3xl bg-white shadow-[0_20px_27px_rgba(0,0,0,0.05)] border border-slate-100 px-3 sm:px-4 lg:px-6 py-5 space-y-6">
          {/* Overdue banner (unchanged except layout) */}
          {overdueCount > 0 && (
            <div
              onClick={() => setShowOverdue((prev) => !prev)}
              className={`cursor-pointer rounded-2xl border border-red-100 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 shadow-sm transition-all ${
                showOverdue ? "ring-1 ring-red-200" : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-500 text-white shadow">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm lg:text-base font-semibold text-red-700">
                      {overdueCount} member
                      {overdueCount > 1 ? "s have" : " has"} overdue installment
                      {overdueCount > 1 ? "s" : ""}.
                    </p>
                    <p className="text-xs lg:text-sm text-red-600">
                      Click to view details and pending amounts.
                    </p>
                  </div>
                </div>
                <span className="text-xs lg:text-sm font-semibold uppercase tracking-wide text-red-600">
                  {showOverdue ? "Hide list" : "Show list"}
                </span>
              </div>

              {showOverdue && overdueMembers.length > 0 && (
                <div className="mt-3 rounded-xl bg-white p-3 shadow-inner">
                  {/* ⬇️ this div handles horizontal scroll on mobile */}
                  <div className="table-scroll rounded-2xl border border-slate-100">
                    <table className="w-full text-xs sm:text-sm lg:text-base">
                      <thead className="bg-[#0A2463] text-white">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">
                            Name
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Mobile
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Plan
                          </th>
                          <th className="px-3 py-2 text-left font-semibold">
                            Due Date
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Pending (₹)
                          </th>
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
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                              } hover:bg-red-50 transition-colors cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/members/${m._id}`);
                              }}
                            >
                              <td className="px-3 py-2 font-medium text-[#212529]">
                                {m.name}
                              </td>
                              <td className="px-3 py-2 text-[#495057]">
                                {m.mobile}
                              </td>
                              <td className="px-3 py-2">
                                <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-[11px] lg:text-sm font-semibold text-red-700">
                                  {m.plan || "N/A"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-[#495057]">
                                {m.overdueDate
                                  ? new Date(
                                      m.overdueDate || ""
                                    ).toLocaleDateString("en-GB")
                                  : "—"}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-red-600">
                                ₹{pendingAmount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPI cards – mobile full width, nice height */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 px-1 sm:px-0">
            <div
              className="kpi-card w-full min-h-[96px] flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-sm hover:bg-white hover:shadow-md transition"
              onClick={() => router.push("/members")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FFC107] to-[#ffda6a] text-white shadow">
                <User size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] lg:text-sm font-semibold uppercase tracking-wide text-[#6C757D]">
                  Total Members
                </p>
                <p className="mt-1 text-xl lg:text-2xl font-bold text-[#212529]">
                  {totalMembers}
                </p>
              </div>
            </div>

            <div
              className="kpi-card w-full min-h-[96px] flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-sm hover:bg-white hover:shadow-md transition mx-2 sm:mx-0"
              onClick={() => router.push("/expiringsoon")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-500 text-white shadow">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] lg:text-sm font-semibold uppercase tracking-wide text-[#6C757D]">
                  Expiring in 7 days
                </p>
                <p className="mt-1 text-xl lg:text-2xl font-bold text-[#212529]">
                  {
                    allMembers.filter((m: Member) => {
                      const expiry = calculateExpiryDate(m);
                      if (!expiry) return false;
                      return expiry >= startOfToday && expiry <= endOf7Days;
                    }).length
                  }
                </p>
              </div>
            </div>

            <div
              className="kpi-card w-full min-h-[96px] flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-sm hover:bg-white hover:shadow-md transition mx-2 sm:mx-0"
              onClick={() => router.push("/expiredmembers")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-400 to-rose-500 text-white shadow">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] lg:text-sm font-semibold uppercase tracking-wide text-[#6C757D]">
                  Expired Memberships
                </p>
                <p className="mt-1 text-xl lg:text-2xl font-bold text-[#212529]">
                  {
                    allMembers.filter((m: Member) => {
                      const expiry = calculateExpiryDate(m);
                      if (!expiry) return false;
                      return expiry < startOfToday;
                    }).length
                  }
                </p>
              </div>
            </div>

            <div
              className="kpi-card w-full min-h-[96px] flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 shadow-sm hover:bg-white hover:shadow-md transition mx-2 sm:mx-0"
              onClick={() => router.push("/revenue")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white shadow">
                <CreditCard size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[11px] lg:text-sm font-semibold uppercase tracking-wide text-[#6C757D]">
                  Membership (This Month)
                </p>
                <p className="mt-1 text-xl lg:text-2xl font-bold text-[#212529]">
                  ₹
                  {allMembers
                    .reduce((acc, m) => {
                      if (!m.payments) return acc;

                      const currentMonth = new Date().getMonth();
                      const currentYear = new Date().getFullYear();

                      const monthPayments = m.payments.reduce((sum, p) => {
                        const paymentDate = new Date(p.date);
                        const isThisMonth =
                          paymentDate.getMonth() === currentMonth &&
                          paymentDate.getFullYear() === currentYear;

                        let monthlyInstallmentsTotal = 0;
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

                        if (isThisMonth) {
                          return (
                            sum + (p.price || 0) + monthlyInstallmentsTotal
                          );
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

          {/* Recent Members table */}
          <div className="pt-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="sm:text-xl lg:text-2xl font-semibold text-[#212529]">
                  Recent Members
                </h2>
              </div>
            </div>

            {/* 🔹 Horizontal scroll container on mobile */}
            <div className="table-scroll rounded-2xl border border-slate-100">
              <table className="w-full text-xs sm:text-sm lg:text-base">
                <thead>
                  <tr className="bg-[#0A2463] text-white">
                    <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide whitespace-nowrap">
                      Plan
                    </th>
                    <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide whitespace-nowrap">
                      Mobile
                    </th>
                    <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide whitespace-nowrap">
                      Date Joined
                    </th>
                    <th className="px-3 py-3 text-left font-semibold uppercase tracking-wide whitespace-nowrap">
                      Expire On
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members
                    .sort(
                      (a, b) =>
                        new Date(b.date || b.joinDate || "").getTime() -
                        new Date(a.date || a.joinDate || "").getTime()
                    )
                    .slice(0, 7)
                    .map((member: Member, idx: number) => {
                      const expiry = calculateExpiryDate(member);
                      return (
                        <tr
                          key={member._id}
                          className={`${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                          } hover:bg-slate-100/70 transition-colors cursor-pointer`}
                          onClick={() => router.push(`/members/${member._id}`)}
                        >
                          <td className="px-3 py-3 text-sm lg:text-base font-semibold text-[#212529] whitespace-nowrap">
                            {member.name}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="inline-flex rounded-full bg-[#FFC107]/15 px-3 py-1 text-[11px] lg:text-sm font-semibold text-[#856404]">
                              {member.plan}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm lg:text-base text-[#495057] whitespace-nowrap">
                            {member.mobile}
                          </td>
                          <td className="px-3 py-3 text-sm lg:text-base text-[#495057] whitespace-nowrap">
                            {new Date(
                              member.joinDate ||
                                member.date ||
                                new Date().toISOString()
                            ).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-3 py-3 text-sm lg:text-base font-semibold text-[#212529] whitespace-nowrap">
                            {expiry ? expiry.toLocaleDateString("en-GB") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {members.length === 0 && (
              <p className="px-3 py-4 text-center text-sm lg:text-base text-gray-500">
                No recent members.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
