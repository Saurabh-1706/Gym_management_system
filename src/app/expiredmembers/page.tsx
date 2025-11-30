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
    <div className="min-h-screen bg-[#E9ECEF] px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-red-500 text-white shadow-md">
            <AlertOctagon size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-red-600 leading-tight">
              Expired Memberships
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              List of members whose plans have already expired.
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
              className="pl-10 pr-4 py-2 rounded-2xl border border-gray-400 bg-gray-100 shadow-sm w-full text-sm sm:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm text-gray-600">
          Showing {filteredMembers.length} of {expiredMembers.length} expired
          members
        </span>
        {expiredMembers.length > 0 && (
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs sm:text-sm font-semibold">
            <AlertOctagon size={16} />
            Total Expired: {expiredMembers.length}
          </span>
        )}
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 py-10 px-4 text-center">
          <p className="text-gray-500 text-base sm:text-lg lg:text-2xl">
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
                className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition duration-300 cursor-pointer"
                onClick={() => router.push(`/members/${member._id}`)}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-3 break-words">
                  <User size={22} className="text-red-500" /> {member.name}
                </h2>

                <div className="space-y-2 sm:space-y-2.5 text-gray-700 text-sm sm:text-base">
                  <p className="flex items-center gap-2">
                    <Phone size={16} className="text-purple-500" />
                    <span className="font-medium">Mobile:</span>
                    <span className="break-all">{member.mobile}</span>
                  </p>

                  <p className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
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
                      <span className="font-medium">Expired On:</span>
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
