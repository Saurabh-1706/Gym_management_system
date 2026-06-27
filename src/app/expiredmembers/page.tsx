"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Calendar, CreditCard, Phone, AlertOctagon } from "lucide-react";

type Installment = {
  amountPaid: number;
  paymentDate: string;
  dueDate?: string;
  modeOfPayment?: string;
};

type Payment = {
  plan: string;
  actualAmount?: number;
  totalPaid?: number;
  remainingAmount?: number;
  installments?: Installment[];
  createdAt?: string;
  paymentStatus?: "Paid" | "Unpaid";
};

type Member = {
  _id: string;
  name: string;
  joinDate?: string;
  date?: string; // joining or first payment date
  plan: string;
  mobile: string;
  email?: string;
  payments?: Payment[];
};

type Plan = {
  _id: string;
  name: string;
  validity: number; // e.g. 30, 3, 6, 12
  validityType: "days" | "months";
};

export default function ExpiredMembersPage() {
  const [expiredMembers, setExpiredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const router = useRouter();

  const today = new Date();
  const endOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, plansRes] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/plans"),
        ]);

        if (!membersRes.ok) throw new Error("Failed to fetch members");
        if (!plansRes.ok) throw new Error("Failed to fetch plans");

        const membersData = await membersRes.json();
        const plansData = await plansRes.json();

        const membersArray: Member[] = Array.isArray(membersData.members)
          ? membersData.members
          : [];

        const plansArray: Plan[] = Array.isArray(plansData.plans)
          ? plansData.plans
          : [];

        setAllPlans(plansArray);

        const expired = membersArray.filter((m) => {
          const expiry = calculateExpiryDate(m, plansArray);
          if (!expiry) return false;
          return expiry.getTime() < endOfToday.getTime();
        });

        setExpiredMembers(expired);
      } catch (error) {
        console.error("❌ Error fetching members/plans:", error);
      }
    };

    fetchData();
  }, []);

  const calculateExpiryDate = (member: Member, plans: Plan[]) => {
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

    const rawStart =
      latestPayment?.installments?.[0]?.paymentDate || member.date;

    if (!rawStart) return null;

    const startDate = new Date(rawStart);
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

    const dbPlan = plans.find(
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

  const filteredMembers = expiredMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-md">
            <AlertOctagon size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-red-500 leading-tight">
              Expired Memberships
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              List of members whose plans have already expired.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative w-full sm:w-64 lg:w-72">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark w-full pl-10 pr-4 py-2.5 rounded-xl text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm text-zinc-400 font-medium">
          Showing {filteredMembers.length} of {expiredMembers.length} expired members
        </span>
        {expiredMembers.length > 0 && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 text-xs sm:text-sm font-semibold">
            <AlertOctagon size={16} />
            Total Expired: {expiredMembers.length}
          </span>
        )}
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="glass-card rounded-2xl py-10 px-4 text-center border border-zinc-800">
          <p className="text-zinc-500 text-base sm:text-lg lg:text-2xl font-headline tracking-wider uppercase">
            No expired memberships found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredMembers.map((member) => {
            const expiryDate = calculateExpiryDate(member, allPlans);

            const latestPayment =
              member.payments && member.payments.length > 0
                ? [...member.payments].sort(
                    (a, b) =>
                      new Date(
                        b.installments?.[b.installments.length - 1]
                          ?.paymentDate || 0
                      ).getTime() -
                      new Date(
                        a.installments?.[a.installments.length - 1]
                          ?.paymentDate || 0
                      ).getTime()
                  )[0]
                : null;

            const renewalDate =
              latestPayment?.installments?.[0]?.paymentDate || member.date;

            const planToShow = latestPayment?.plan || member.plan;

            return (
              <div
                key={member._id}
                className="glass-card rounded-2xl p-5 sm:p-6 border border-zinc-800 hover:border-zinc-700/80 hover:scale-[1.02] transition duration-300 cursor-pointer flex flex-col justify-between shadow-lg"
                onClick={() => router.push(`/members/${member._id}`)}
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-red-400 flex items-center gap-2 mb-4 break-words">
                    <User size={22} className="text-red-400" /> {member.name}
                  </h2>

                  <div className="space-y-2 text-zinc-350 text-sm sm:text-base">
                    <p className="flex items-center gap-2">
                      <Phone size={16} className="text-purple-400" />
                      <span className="font-medium text-[#e5e2e1]">Mobile:</span>
                      <span className="break-all">{member.mobile}</span>
                    </p>

                    <p className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-400" />
                      <span className="font-medium text-[#e5e2e1]">Renewal Date:</span>
                      <span>
                        {renewalDate
                          ? new Date(renewalDate).toLocaleDateString("en-GB")
                          : "—"}
                      </span>
                    </p>

                    <p className="flex items-center gap-2 flex-wrap">
                      <CreditCard size={16} className="text-[#22c55e]" />
                      <span className="font-medium text-[#e5e2e1]">Plan:</span>
                      <span className="px-2.5 py-0.5 bg-white/5 border border-white/5 text-zinc-300 rounded-full text-xs font-semibold">
                        {planToShow}
                      </span>
                    </p>

                    {expiryDate && (
                      <p className="flex items-center gap-2 text-red-450">
                        <Calendar size={16} className="text-red-500" />
                        <span className="font-medium text-red-400">Expired On:</span>
                        <span className="font-semibold">
                          {expiryDate.toLocaleDateString("en-GB")}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
