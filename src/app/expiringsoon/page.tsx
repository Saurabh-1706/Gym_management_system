"use client";

import { useEffect, useState } from "react";
import { User, Calendar, CreditCard, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type Member = {
  _id: string;
  name: string;
  date: string;
  plan: string;
  mobile: string;
  email?: string;
  price?: string;
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

        const soon = membersArray.filter((m) => {
          const expiry = calculateExpiryDateObj(m.date, m.plan);
          return (
            expiry >= today &&
            expiry <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        });

        setExpiringMembers(soon);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMembers();
  }, []);

  const calculateExpiryDateObj = (joinDate: string, plan: string) => {
    const date = new Date(joinDate);

    // Match formats like "Custom(10 days)" OR "2 months" OR "14 days"
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

    // Fallback for predefined plans
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
        date.setMonth(date.getMonth() + 1); // fallback
    }

    return date;
  };

  const filteredMembers = expiringMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-500 flex items-center gap-3">
          <Clock size={36} className="text-yellow-500" />
          Expiring Soon Membership
        </h1>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-200">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border bg-gray-100 placeholder-gray-500 border-gray-500 shadow-sm w-72 text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
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

        {filteredMembers.map((member) => (
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
                <Calendar size={18} className="text-blue-500" />
                Joined: {new Date(member.date).toLocaleDateString("en-GB")}
              </p>
              <p className="flex items-center gap-2">
                <CreditCard size={18} className="text-green-600" />
                Plan: {member.plan}
              </p>
              <p className="flex items-center gap-2">
                <Calendar size={18} className="text-red-500" />
                Expiring On:{" "}
                {calculateExpiryDateObj(
                  member.date,
                  member.plan
                ).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
