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
    <div className="dashboard-body min-h-screen bg-[#0F0F0F] text-[#e5e2e1] font-body">
      {/* 🔹 Mobile: no side padding, Desktop: small padding */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <section className="mb-8">
          <h1 className="font-headline text-4xl sm:text-5xl text-[#e5e2e1] uppercase tracking-tight">Performance Overview</h1>
          <p className="text-[#e0c0b1] opacity-75 font-body text-sm mt-1">Real-time telemetry from Iron Pulse Elite Centers.</p>
        </section>

        {/* Overdue banner (styled as dark red glass card) */}
        {overdueCount > 0 && (
          <div
            onClick={() => setShowOverdue((prev) => !prev)}
            className={`cursor-pointer rounded-2xl border border-red-500/20 bg-red-950/20 backdrop-blur-md px-5 py-4 mb-8 shadow-lg transition-all hover:bg-red-950/30 ${
              showOverdue ? "ring-1 ring-red-500/30" : ""
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 shadow">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-red-400">
                    {overdueCount} member{overdueCount > 1 ? "s have" : " has"} overdue installment{overdueCount > 1 ? "s" : ""}.
                  </p>
                  <p className="text-xs sm:text-sm text-red-500/80">
                    Click to view details and pending amounts.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
                {showOverdue ? "Hide list" : "Show list"}
              </span>
            </div>

            {showOverdue && overdueMembers.length > 0 && (
              <div className="mt-4 rounded-xl bg-black/40 p-4 border border-red-950/50">
                <div className="table-scroll rounded-xl border border-zinc-800/80 overflow-hidden">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-[#1c1b1b] text-[#e5e2e1] border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Name</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Mobile</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">Due Date</th>
                        <th className="px-4 py-3 text-right font-bold uppercase tracking-wider">Pending (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
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
                            className="hover:bg-red-500/5 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/members/${m._id}`);
                            }}
                          >
                            <td className="px-4 py-3 font-semibold text-[#e5e2e1]">{m.name}</td>
                            <td className="px-4 py-3 text-zinc-400">{m.mobile}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-red-950/40 border border-red-500/20 px-3 py-0.5 text-xs text-red-400">
                                {m.plan || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-zinc-400">
                              {m.overdueDate
                                ? new Date(m.overdueDate || "").toLocaleDateString("en-GB")
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-red-500">
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

        {/* KPI Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Members */}
          <div
            className="glass-card rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
            onClick={() => router.push("/members")}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs uppercase tracking-widest text-[#e0c0b1]">Total Members</span>
              <User size={20} className="text-[#f97316]" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl text-[#f97316]">{totalMembers}</h2>
              <span className="text-[#22c55e] text-xs font-bold flex items-center gap-0.5">
                Active Now
              </span>
            </div>
            <div className="mt-5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#f97316] to-[#ff8c3a] w-[75%]"></div>
            </div>
          </div>

          {/* Expiring in 7 Days */}
          <div
            className="glass-card rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
            onClick={() => router.push("/expiringsoon")}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs uppercase tracking-widest text-[#e0c0b1]">Expiring Soon</span>
              <Calendar size={20} className="text-[#22c55e]" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl text-[#22c55e]">
                {
                  allMembers.filter((m: Member) => {
                    const expiry = calculateExpiryDate(m);
                    if (!expiry) return false;
                    return expiry >= startOfToday && expiry <= endOf7Days;
                  }).length
                }
              </h2>
              <span className="text-zinc-400 text-xs font-medium">In 7 Days</span>
            </div>
            <div className="mt-5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] w-[25%]"></div>
            </div>
          </div>

          {/* Expired Memberships */}
          <div
            className="glass-card rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
            onClick={() => router.push("/expiredmembers")}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs uppercase tracking-widest text-[#e0c0b1]">Expired</span>
              <Calendar size={20} className="text-red-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl text-red-500">
                {
                  allMembers.filter((m: Member) => {
                    const expiry = calculateExpiryDate(m);
                    if (!expiry) return false;
                    return expiry < startOfToday;
                  }).length
                }
              </h2>
              <span className="text-zinc-400 text-xs font-medium">Action Needed</span>
            </div>
            <div className="mt-5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 w-[45%]"></div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div
            className="glass-card rounded-2xl p-6 relative overflow-hidden group cursor-pointer"
            onClick={() => router.push("/revenue")}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs uppercase tracking-widest text-[#e0c0b1]">Revenue (Month)</span>
              <CreditCard size={20} className="text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline text-4xl text-cyan-400">
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
              </h2>
              <span className="text-zinc-400 text-xs font-medium">Estimated</span>
            </div>
            <div className="mt-5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 w-[60%]"></div>
            </div>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Members Panel */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-headline text-2xl uppercase text-[#e5e2e1]">Recent Signups</h3>
                <p className="text-[#e0c0b1]/80 text-xs mt-1">Telemetry log of newly registered athletes.</p>
              </div>
            </div>

            <div className="table-scroll rounded-xl border border-zinc-800/80 overflow-hidden">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-[#1c1b1b] text-zinc-300 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">Plan</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">Mobile</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">Joined</th>
                    <th className="px-4 py-3 text-left font-bold uppercase tracking-wider whitespace-nowrap">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
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
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => router.push(`/members/${member._id}`)}
                        >
                          <td className="px-4 py-3 font-semibold text-[#e5e2e1] whitespace-nowrap">
                            {member.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex rounded-full bg-[#f97316]/10 border border-[#f97316]/20 px-3 py-0.5 text-xs font-semibold text-[#f97316]">
                              {member.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                            {member.mobile}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                            {new Date(
                              member.joinDate ||
                                member.date ||
                                new Date().toISOString()
                            ).toLocaleDateString("en-GB")}
                          </td>
                          <td className="px-4 py-3 font-semibold text-zinc-300 whitespace-nowrap">
                            {expiry ? expiry.toLocaleDateString("en-GB") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {members.length === 0 && (
              <p className="px-4 py-6 text-center text-zinc-500">
                No recent members found.
              </p>
            )}
          </div>

          {/* Quick Actions Feed */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline text-2xl uppercase text-[#e5e2e1]">Shortcut Registry</h3>
              </div>
              <div className="flex flex-col gap-3 font-body">
                <button
                  onClick={() => router.push("/registration")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-zinc-800 text-left text-sm font-semibold hover:border-[#f97316] hover:bg-white/10 hover:text-white transition flex items-center justify-between group cursor-pointer"
                >
                  <span>REGISTER NEW MEMBER</span>
                  <span className="text-[#f97316] group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button
                  onClick={() => router.push("/plan")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-zinc-800 text-left text-sm font-semibold hover:border-[#f97316] hover:bg-white/10 hover:text-white transition flex items-center justify-between group cursor-pointer"
                >
                  <span>MANAGE GYM PLANS</span>
                  <span className="text-[#f97316] group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button
                  onClick={() => router.push("/coach")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-zinc-800 text-left text-sm font-semibold hover:border-[#f97316] hover:bg-white/10 hover:text-white transition flex items-center justify-between group cursor-pointer"
                >
                  <span>COACH DIRECTORY</span>
                  <span className="text-[#f97316] group-hover:translate-x-1 transition-transform">→</span>
                </button>
                <button
                  onClick={() => router.push("/revenue")}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-zinc-800 text-left text-sm font-semibold hover:border-[#f97316] hover:bg-white/10 hover:text-white transition flex items-center justify-between group cursor-pointer"
                >
                  <span>FINANCIAL telemetry</span>
                  <span className="text-[#f97316] group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Assets (Equipment Monitoring Style) */}
        <section className="mt-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="font-headline text-3xl text-[#e5e2e1] uppercase">Facility status</h3>
              <p className="text-[#e0c0b1]/80 text-xs mt-1">Monitoring status of high-performance machinery.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-5 border-l-4 border-[#22c55e]">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 text-[#22c55e]">
                  ⚡
                </div>
                <div className="flex-1">
                  <h4 className="text-zinc-200 font-bold text-sm uppercase">Cardio Arena</h4>
                  <p className="text-xs text-zinc-400">12/12 Units Online</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#22c55e] w-full"></div>
                    </div>
                    <span className="text-[10px] text-[#22c55e] font-bold">100%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 border-l-4 border-[#f97316]">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 text-[#f97316]">
                  🏋️
                </div>
                <div className="flex-1">
                  <h4 className="text-zinc-200 font-bold text-sm uppercase">Strength Racks</h4>
                  <p className="text-xs text-zinc-400">2 Units in Maintenance</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#f97316] w-[82%]"></div>
                    </div>
                    <span className="text-[10px] text-[#f97316] font-bold">82%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-card rounded-xl p-5 border-l-4 border-red-500">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 text-red-500">
                  ❄️
                </div>
                <div className="flex-1">
                  <h4 className="text-zinc-200 font-bold text-sm uppercase">Cryo Recovery</h4>
                  <p className="text-xs text-zinc-400">Compressor Service Required</p>
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 w-[45%]"></div>
                    </div>
                    <span className="text-[10px] text-red-500 font-bold">45%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
