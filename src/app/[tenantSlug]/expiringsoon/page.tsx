"use client";

import { useEffect, useState } from "react";
import { User, Calendar, CreditCard, Clock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

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
  date?: string;
  plan: string;
  mobile: string;
  email?: string;
  payments?: Payment[];
};

export default function ExpiringSoonPage() {
  const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { tenantSlug } = useParams();
  const today = new Date();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("Failed to fetch members");

        const data = await res.json();
        const membersArray: Member[] = Array.isArray(data.members)
          ? data.members
          : [];

        const soonExpiring = membersArray.filter((m) => {
          if (!m.payments || m.payments.length === 0) return false;
          if (m.plan?.toLowerCase() === "no plan") return false;

          const latestPayment = [...m.payments]
            .filter((p) => p.installments && p.installments.length > 0)
            .sort((a, b) => {
              const aDate =
                a.installments?.[a.installments.length - 1]?.paymentDate ||
                a.createdAt ||
                "";
              const bDate =
                b.installments?.[b.installments.length - 1]?.paymentDate ||
                b.createdAt ||
                "";
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            })[0];

          if (!latestPayment) return false;

          const renewalDate =
            latestPayment.installments?.length
              ? latestPayment.installments[
                  latestPayment.installments.length - 1
                ]?.paymentDate
              : latestPayment.createdAt;

          if (!renewalDate) return false;

          const planToCheck = latestPayment.plan || m.plan;
          const expiryDate = calculateExpiryDateObj(renewalDate, planToCheck);

          return (
            expiryDate >= today &&
            expiryDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        });

        setExpiringMembers(soonExpiring);
      } catch (err) {
        console.error("❌ Error fetching members:", err);
      }
    };

    fetchMembers();
  }, []);

  const calculateExpiryDateObj = (start: string, plan: string) => {
    const date = new Date(start);

    if (plan.toLowerCase() === "no plan") return date;

    const match = plan.match(/(\d+)\s*(day|days|month|months|year|years)/i);

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case "day":
        case "days":
          date.setDate(date.getDate() + value - 1);
          break;
        case "month":
        case "months":
          date.setMonth(date.getMonth() + value);
          date.setDate(date.getDate() - 1);
          break;
        case "year":
        case "years":
          date.setFullYear(date.getFullYear() + value);
          date.setDate(date.getDate() - 1);
          break;
      }
      return date;
    }

    switch (plan.toLowerCase()) {
      case "monthly":
      case "1 month":
      case "1 months":
        date.setMonth(date.getMonth() + 1);
        date.setDate(date.getDate() - 1);
        break;
      case "quarterly":
      case "3 months":
        date.setMonth(date.getMonth() + 3);
        date.setDate(date.getDate() - 1);
        break;
      case "half yearly":
      case "6 months":
        date.setMonth(date.getMonth() + 6);
        date.setDate(date.getDate() - 1);
        break;
      case "yearly":
      case "12 months":
        date.setFullYear(date.getFullYear() + 1);
        date.setDate(date.getDate() - 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
        date.setDate(date.getDate() - 1);
    }

    return date;
  };

  const filteredMembers = expiringMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316] shadow-md">
            <Clock size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] leading-tight">
              Expiring Soon Memberships
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Members whose plans will end in the next 7 days.
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
              className="input-dark w-full pl-10 pr-4 py-2.5 rounded-lg text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm text-zinc-400 font-medium">
          Showing {filteredMembers.length} of {expiringMembers.length} expiring members
        </span>
        {expiringMembers.length > 0 && (
          <span className="badge-pending sm:text-sm font-semibold gap-2">
            <Clock size={16} />
            Total Expiring: {expiringMembers.length}
          </span>
        )}
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="glass-card rounded-xl py-10 px-4 text-center border-[#2A2A2A]">
          <p className="text-zinc-500 text-base sm:text-lg lg:text-2xl font-headline tracking-wider uppercase">
            No memberships expiring soon.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredMembers.map((member) => {
            const latestPayment = [...(member.payments || [])].sort((a, b) => {
              const aDate =
                a.installments?.[a.installments.length - 1]?.paymentDate ||
                a.createdAt ||
                "";
              const bDate =
                b.installments?.[b.installments.length - 1]?.paymentDate ||
                b.createdAt ||
                "";
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            })[0];

            const renewalDate =
              latestPayment?.installments?.length
                ? latestPayment.installments[
                    latestPayment.installments.length - 1
                  ]?.paymentDate
                : latestPayment?.createdAt;

            const planToShow = latestPayment?.plan || member.plan;

            const expiryDate =
              planToShow?.toLowerCase() === "no plan" || !renewalDate
                ? null
                : calculateExpiryDateObj(renewalDate, planToShow);

            return (
              <div
                key={member._id}
                className="glass-card rounded-xl p-5 sm:p-6 border-[#2A2A2A] hover:border-zinc-700/80 hover:scale-[1.02] transition duration-300 cursor-pointer flex flex-col justify-between shadow-lg"
                onClick={() => router.push(`/${tenantSlug}/members/${member._id}`)}
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] flex items-center gap-2 mb-4 break-words">
                    <User size={22} className="text-[#f97316]" /> {member.name}
                  </h2>

                  <div className="space-y-2 text-zinc-350 text-sm sm:text-base">
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
                      <p className="flex items-center gap-2 text-red-455">
                        <Calendar size={16} className="text-red-500" />
                        <span className="font-medium text-red-400">Expiring On:</span>
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
