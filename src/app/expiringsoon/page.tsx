"use client";

import { useEffect, useState } from "react";
import { User, Calendar, CreditCard, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-[#E9ECEF] px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-yellow-400 text-[#0A2463] shadow-md">
            <Clock size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#d97706] leading-tight">
              Expiring Soon Memberships
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Members whose plans will end in the next 7 days.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative w-full sm:w-64 lg:w-72">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl border bg-gray-100 placeholder-gray-500 border-gray-400 shadow-sm w-full text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm text-gray-600">
          Showing {filteredMembers.length} of {expiringMembers.length} expiring
          members
        </span>
        {expiringMembers.length > 0 && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs sm:text-sm font-semibold">
            <Clock size={16} />
            Total Expiring: {expiringMembers.length}
          </span>
        )}
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 py-10 px-4 text-center">
          <p className="text-gray-500 text-base sm:text-lg lg:text-2xl">
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
                className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition duration-300 cursor-pointer"
                onClick={() => router.push(`/members/${member._id}`)}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-3 break-words">
                  <User size={22} className="text-yellow-500" /> {member.name}
                </h2>

                <div className="space-y-2 sm:space-y-2.5 text-gray-700 text-sm sm:text-base">
                  <p className="flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600" />
                    <span className="font-medium">Renewal Date:</span>
                    <span>
                      {renewalDate
                        ? new Date(renewalDate).toLocaleDateString("en-GB")
                        : "—"}
                    </span>
                  </p>

                  <p className="flex items-center gap-2 flex-wrap">
                    <CreditCard size={16} className="text-green-600" />
                    <span className="font-medium">Plan:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm max-w-full truncate">
                      {planToShow}
                    </span>
                  </p>

                  {expiryDate && (
                    <p className="flex items-center gap-2">
                      <Calendar size={16} className="text-red-500" />
                      <span className="font-medium">Expiring On:</span>
                      <span>
                        {expiryDate.toLocaleDateString("en-GB")}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
