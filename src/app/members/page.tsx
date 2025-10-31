"use client";

import { useEffect, useState } from "react";
import {
  User,
  Phone,
  Calendar,
  CreditCard,
  Users,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Payment = {
  _id: string;
  plan: string;
  price: number;
  date: string;
  modeOfPayment: string;
  paymentStatus: string;
};

type Member = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  plan?: string; // ✅ optional now
  date?: string;
  payments?: Payment[];
};

type Plan = {
  _id: string;
  name: string;
  validity: number;
  validityType?: "months" | "days";
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("All");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortBy, setSortBy] = useState<"name" | "expiry" | "newest">("expiry");

  const router = useRouter();

  // ✅ Fetch Members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        const data = await res.json();
        const membersArray = Array.isArray(data)
          ? data
          : Array.isArray(data.members)
          ? data.members
          : data.data || [];
        setMembers(membersArray);
      } catch (err) {
        console.error("Error fetching members:", err);
        setMembers([]);
      }
    };
    fetchMembers();
  }, []);

  // ✅ Fetch Plans
  useEffect(() => {
    const fetchPlans = async () => {
      const res = await fetch("/api/plans");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.plans)) {
          const mapped: Plan[] = data.plans.map((p: any) => ({
            _id: p._id,
            name: p.name || p.plan,
            validity: Number(p.validity) || 0,
            validityType: p.validityType || "months",
          }));
          mapped.sort((a, b) => a.validity - b.validity);
          setPlans(mapped);
        }
      }
    };
    fetchPlans();
  }, []);

  // ✅ Get latest join/renewal date
  const getJoinDate = (member: Member) => {
    if (member.payments && member.payments.length > 0) {
      const sortedPayments = [...member.payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return new Date(sortedPayments[0].date);
    }
    return member.date ? new Date(member.date) : new Date();
  };

  // ✅ Handle missing plan safely
  const calculateExpiryDate = (member: Member) => {
    const joinDate = getJoinDate(member);
    const date = new Date(joinDate.getTime());
    const planName = member.plan || "";

    if (!planName) {
      // No plan yet, just return join date
      return date;
    }

    const planFromList = plans.find(
      (p) => p.name?.toLowerCase() === planName.toLowerCase()
    );

    if (planFromList && typeof planFromList.validity === "number") {
      const type = planFromList.validityType || "months";
      if (type === "days") {
        date.setDate(date.getDate() + planFromList.validity);
      } else {
        date.setMonth(date.getMonth() + planFromList.validity);
      }
      return date;
    }

    const match = planName.match(/(\d+)\s*(day|days|month|months|year|years)/i);
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

    switch (planName.toLowerCase()) {
      case "monthly":
      case "1 month":
      case "1 months":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
      case "3 months":
        date.setMonth(date.getMonth() + 3);
        break;
      case "half yearly":
      case "6 months":
        date.setMonth(date.getMonth() + 6);
        break;
      case "yearly":
      case "12 months":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date;
  };

  // ✅ Determine status
  const getStatus = (member: Member) => {
    if (!member.plan) return "Inactive";
    const expiry = calculateExpiryDate(member);
    const grace = new Date(expiry);
    grace.setDate(grace.getDate() + 7);
    return grace >= new Date() ? "Active" : "Inactive";
  };

  // ✅ Plan display
  const getPlanDisplay = (member: Member) => member.plan || "No Plan";

  const getPaymentStatus = (member: Member) => {
    if (member.payments && member.payments.length > 0) {
      const lastPayment = member.payments[member.payments.length - 1];
      return lastPayment.paymentStatus || "Unpaid";
    }
    return "Unpaid";
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    const res = await fetch(`/api/members/${selectedMember._id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m._id !== selectedMember._id));
      setShowDeleteModal(false);
      setSelectedMember(null);
    } else alert("Delete failed");
  };

  // ✅ Filter and sort
  const filteredMembers = members
    .filter((m) => {
      const matchesSearch =
        m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.mobile?.includes(searchQuery);
      const matchesPlan =
        selectedPlan === "All" ||
        (selectedPlan === "Custom"
          ? m.plan?.toLowerCase().startsWith("custom")
          : m.plan === selectedPlan);
      return matchesSearch && matchesPlan;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      else if (sortBy === "expiry")
        return (
          calculateExpiryDate(a).getTime() - calculateExpiryDate(b).getTime()
        );
      else if (sortBy === "newest")
        return getJoinDate(b).getTime() - getJoinDate(a).getTime();
      return 0;
    });

  return (
    <div className="p-6 relative bg-[#E9ECEF]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[42px] font-bold text-[#0A2463] flex items-center gap-3">
          <Users size={42} className="text-[#FFC107]" />
          View Members
        </h2>

        <div className="flex items-center gap-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-600">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl border bg-gray-100 border-gray-400 shadow-sm w-52 text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#0A2463] transition-all duration-300"
            />
          </div>

          {/* Plan Filter */}
          <div className="relative w-52">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full appearance-none border border-gray-400 rounded-2xl py-2 pl-4 pr-10 text-[#212529] font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-[#FFC107] transition-all duration-300 cursor-pointer bg-white"
            >
              <option value="All">All Plans</option>
              {plans
                .sort((a, b) => a.validity - b.validity)
                .map((plan) => (
                  <option key={plan._id} value={plan.name}>
                    {plan.name}
                  </option>
                ))}
              <option value="Custom">Custom</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              ▼
            </div>
          </div>

          {/* Sort By */}
          <div className="relative w-52">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "name" | "expiry" | "newest")
              }
              className="w-full appearance-none border border-gray-400 rounded-2xl py-2 pl-4 pr-7 text-[#212529] font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFC107] focus:border-[#FFC107] transition-all duration-300 cursor-pointer bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="expiry">Sort by Expiring Soon</option>
              <option value="newest">Sort by Newest Joined</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              ▼
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-2 bg-white border border-gray-400 rounded-2xl px-2 py-1 shadow-sm">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-xl ${
                viewMode === "card"
                  ? "bg-[#FFC107] text-white"
                  : "text-gray-400 hover:bg-gray-200"
              }`}
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg ${
                viewMode === "table"
                  ? "bg-[#FFC107] text-white"
                  : "text-gray-400 hover:bg-gray-200"
              }`}
            >
              <TableIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Total count */}
      <div className="flex items-center mb-6">
        <span className="ml-auto text-2xl font-semibold text-[#0A2463]">
          Total Members: {filteredMembers.length}
        </span>
      </div>

      {/* Card / Table */}
      {viewMode === "card" ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member, index) => {
            const expiryDate = calculateExpiryDate(member);
            const today = new Date();
            const diffDays = Math.ceil(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            const status = getStatus(member);

            return (
              <div
                key={member._id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition duration-300 cursor-pointer relative"
                onClick={() => router.push(`/members/${member._id}`)}
              >
                <span className="absolute top-3 left-3 text-sm font-semibold text-gray-500">
                  #{index + 1}
                </span>

                {/* Status dot */}
                {/* Status dot + Payment badge */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  {/* Status dot */}
                  <span
                    className={`w-4 h-4 rounded-full ${
                      status === "Active" ? "bg-green-500" : "bg-red-600"
                    }`}
                  ></span>

                  {/* Payment badge */}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      getPaymentStatus(member) === "Paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getPaymentStatus(member)}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-[#0A2463] flex items-center gap-2 px-4 mb-3">
                  <User size={24} className="text-[#FFC107]" />
                  {member.name}
                </h2>

                <div className="space-y-2 text-[#212529] px-4 text-[16px]">
                  <p className="flex items-center gap-2 text-lg">
                    <Calendar size={18} className="text-[#0A2463]" />
                    Joined: {getJoinDate(member).toLocaleDateString("en-GB")}
                  </p>
                  <p className="flex items-center gap-2">
                    <CreditCard size={18} className="text-green-600" />
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-base font-semibold">
                      {getPlanDisplay(member)}
                    </span>
                  </p>

                  <p className="flex items-center gap-2 text-lg">
                    <Phone size={18} className="text-purple-500" />
                    {member.mobile}
                  </p>
                </div>

                {/* Expiry badge */}
                {diffDays < 8 && (
                  <div
                    className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-sm font-semibold shadow-lg ${
                      diffDays < 0
                        ? "bg-red-600 text-white"
                        : "bg-orange-400 text-white"
                    }`}
                  >
                    {diffDays < 0
                      ? `Expired on ${expiryDate.toLocaleDateString("en-GB")}`
                      : `Expiring in ${diffDays} days`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FFC107] text-white text-[22px]">
              <tr>
                <th className="p-3">Sr.No.</th>
                <th className="p-3">Name</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Payment Status</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => {
                const status = getStatus(member);
                const paymentStatus = getPaymentStatus(member);
                return (
                  <tr
                    key={member._id}
                    className="border-b text-[18px] hover:bg-gray-100 cursor-pointer"
                    onClick={() => router.push(`/members/${member._id}`)}
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{member.name}</td>
                    <td className="p-3">{member.mobile}</td>
                    <td className="p-3">{getPlanDisplay(member)}</td>
                    <td className="p-3">
                      {getJoinDate(member).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-3">
                      {calculateExpiryDate(member).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center ml-10">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          status === "Active" ? "bg-green-500" : "bg-red-600"
                        }`}
                      ></span>
                      {status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md relative">
            <h3 className="Text-xl font-semibold text-[#0A2463] mb-4">
              Are you sure you want to delete {selectedMember.name}?
            </h3>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-[#212529] px-4 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
