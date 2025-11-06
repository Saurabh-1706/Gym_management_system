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
          if (m.plan?.toLowerCase() === "no plan") return false; // ✅ Skip no-plan members

          // ✅ Find latest payment safely
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

          // ✅ Within next 7 days (not expired)
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

  // 🧮 Calculate expiry based on plan string (subtract 1 day logic)
  const calculateExpiryDateObj = (start: string, plan: string) => {
    const date = new Date(start);

    // Skip if plan is "No Plan"
    if (plan.toLowerCase() === "no plan") return date;

    const match = plan.match(/(\d+)\s*(day|days|month|months|year|years)/i);

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case "day":
        case "days":
          date.setDate(date.getDate() + value - 1); // ✅ subtract 1 day
          break;
        case "month":
        case "months":
          date.setMonth(date.getMonth() + value);
          date.setDate(date.getDate() - 1); // ✅ end one day before
          break;
        case "year":
        case "years":
          date.setFullYear(date.getFullYear() + value);
          date.setDate(date.getDate() - 1); // ✅ end one day before
          break;
      }
      return date;
    }

    // 🧠 fallback for common plan names
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

  // 🔍 Search filter
  const filteredMembers = expiringMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-500 flex items-center gap-3">
          <Clock size={36} className="text-yellow-500" />
          Expiring Soon Memberships
        </h1>

        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border bg-gray-100 placeholder-gray-500 border-gray-400 shadow-sm w-72 text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
          />
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length === 0 && (
          <p className="text-gray-500 col-span-full text-center text-2xl">
            No memberships expiring soon.
          </p>
        )}

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
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition duration-300 cursor-pointer"
              onClick={() => router.push(`/members/${member._id}`)}
            >
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-3">
                <User size={24} className="text-yellow-500" /> {member.name}
              </h2>

              <div className="space-y-2 text-gray-700 text-lg">
                <p className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" />
                  <strong>Renewal Date:</strong>{" "}
                  {renewalDate
                    ? new Date(renewalDate).toLocaleDateString("en-GB")
                    : "—"}
                </p>

                <p className="flex items-center gap-2">
                  <CreditCard size={18} className="text-green-600" />
                  <strong>Plan:</strong>{" "}
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {planToShow}
                  </span>
                </p>

                {expiryDate && (
                  <p className="flex items-center gap-2">
                    <Calendar size={18} className="text-red-500" />
                    <strong>Expiring On:</strong>{" "}
                    {expiryDate.toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
