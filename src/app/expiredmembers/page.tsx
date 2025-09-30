"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Calendar, CreditCard, Phone, AlertOctagon } from "lucide-react";

type Payment = {
  plan: string;
  price: number;
  date: string; // payment date
  modeOfPayment: string;
};

type Member = {
  _id: string;
  name: string;
  date: string; // join date
  plan: string; // initial plan
  mobile: string;
  email?: string;
  payments?: Payment[];
};

type Plan = {
  _id: string;
  name: string;
};

export default function ExpiredMembersPage() {
  const [expiredMembers, setExpiredMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  // --- Helper: pick latest payment ---
  const getLatestPayment = (member: Member) => {
    if (member.payments && member.payments.length > 0) {
      return [...member.payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
    }
    return null;
  };

  // --- Expiry calculation ---
  const calculateExpiryDateObj = (joinDate: string, plan: string) => {
    const date = new Date(joinDate);

    // Match "Custom(10 days)" or "10 days" / "2 months" / "1 year"
    const match = plan.match(
      /(?:Custom\s*\()?\s*(\d+)\s*(day|days|month|months|year|years)\)?/i
    );

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

    // Predefined named plans
    switch (plan.toLowerCase()) {
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      case "half yearly":
        date.setMonth(date.getMonth() + 6);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // fallback
    }

    return date;
  };

  const calculateExpiryDateFormatted = (joinDate: string, plan: string) => {
    return calculateExpiryDateObj(joinDate, plan).toLocaleDateString("en-GB");
  };

  // --- Fetch expired members ---
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("Failed to fetch members");

        const data = await res.json();
        const membersArray: Member[] = Array.isArray(data.members)
          ? data.members
          : [];

        const today = new Date();
        const expired = membersArray.filter((m) => {
          const lastPayment = getLatestPayment(m);
          const planToCheck = lastPayment ? lastPayment.plan : m.plan;
          const dateToCheck = lastPayment ? lastPayment.date : m.date;

          return calculateExpiryDateObj(dateToCheck, planToCheck) < today;
        });

        setExpiredMembers(expired);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMembers();
  }, []);

  // --- Fetch plans (optional use) ---
  useEffect(() => {
    const fetchPlans = async () => {
      const res = await fetch("/api/plans");
      const data: Plan[] = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    };
    fetchPlans();
  }, []);

  // --- Search filter ---
  const filteredMembers = expiredMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-red-500 flex items-center gap-3">
          <AlertOctagon size={36} className="text-red-500" />
          Expired Memberships
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
            className="pl-10 pr-4 py-2 rounded-full border border-gray-500 placeholder-gray-500 bg-gray-100 shadow-sm w-72 text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length === 0 && (
          <p className="text-gray-500 col-span-full text-center text-2xl">
            No expired memberships.
          </p>
        )}

        {filteredMembers.map((member) => {
          const lastPayment = getLatestPayment(member);
          const planToShow = lastPayment ? lastPayment.plan : member.plan;
          const dateToShow = lastPayment ? lastPayment.date : member.date;
          const expiredOn = calculateExpiryDateFormatted(dateToShow, planToShow);

          return (
            <div
              key={member._id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition duration-300 cursor-pointer"
              onClick={() => router.push(`/members/${member._id}`)}
            >
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-3">
                <User size={24} className="text-red-500" /> {member.name}
              </h2>

              <div className="space-y-2 text-gray-700 text-lg">
                <p className="flex items-center gap-2">
                  <Phone size={18} className="text-purple-500" />
                  <strong>Mobile: </strong>
                  {member.mobile}
                </p>

                <p className="flex items-center gap-2">
                  <Calendar size={18} className="text-blue-500" />
                  <strong> Joined: </strong>
                  {new Date(member.date).toLocaleDateString("en-GB")}
                </p>

                <p className="flex items-center gap-2">
                  <CreditCard size={18} className="text-green-600" />
                  <strong> Plan: </strong>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {planToShow}
                  </span>
                </p>

                <p className="flex items-center gap-2">
                  <Calendar size={18} className="text-red-500" />
                  <strong>Expired On:</strong> {expiredOn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
