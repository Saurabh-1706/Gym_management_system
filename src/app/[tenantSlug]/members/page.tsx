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
import { useRouter, useParams } from "next/navigation";

type Installment = {
  amountPaid: number;
  paymentDate: string;
  dueDate?: string | null;
  modeOfPayment?: string;
};

type Payment = {
  _id: string;
  plan: string;
  actualAmount?: number;
  paymentStatus: string;
  installments: Installment[];
};

type Member = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  plan?: string;
  date?: string;
  joinDate?: string;
  status?: string;
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
  const { tenantSlug } = useParams();

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

  const getRenewalDate = (member: Member) => {
    if (member.payments && member.payments.length > 0) {
      const latestPayment = [...member.payments]
        .filter((p) => p.installments && p.installments.length > 0)
        .sort((a, b) => {
          const aDate = new Date(a.installments[0].paymentDate).getTime();
          const bDate = new Date(b.installments[0].paymentDate).getTime();
          return bDate - aDate;
        })[0];

      if (latestPayment && latestPayment.installments[0]?.paymentDate) {
        return new Date(latestPayment.installments[0].paymentDate);
      }
    }

    if (member.joinDate) {
      const [y, m, d] = member.joinDate.split("T")[0].split("-").map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    }
    if (member.date) {
      const [y, m, d] = member.date.split("T")[0].split("-").map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    }

    return new Date();
  };

  const calculateExpiryDate = (member: Member) => {
    const renewDate = getRenewalDate(member);
    const date = new Date(renewDate.getTime());
    const planName = member.plan || "";

    if (!planName) return date;

    const planFromList = plans.find(
      (p) => p.name?.toLowerCase() === planName.toLowerCase()
    );

    if (planFromList && typeof planFromList.validity === "number") {
      const type = planFromList.validityType || "months";
      if (type === "days") {
        date.setDate(date.getDate() + planFromList.validity - 1);
      } else {
        date.setMonth(date.getMonth() + planFromList.validity);
        date.setDate(date.getDate() - 1);
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

    switch (planName.toLowerCase()) {
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
        return getRenewalDate(b).getTime() - getRenewalDate(a).getTime();
      return 0;
    });

  const getMembershipStatus = (member: Member) => {
    // If no plan or explicitly "no plan" → Inactive
    if (!member.plan || member.plan.toLowerCase() === "no plan") {
      return "Inactive";
    }

    const expiryDate = calculateExpiryDate(member);
    const today = new Date();

    // Normalize to date-only comparison (ignore time part)
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (expiryDate.getTime() >= todayMidnight.getTime()) {
      return "Active"; // ✅ Active membership regardless of plan name
    }

    return "Inactive";
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 bg-[#0F0F0F] text-[#e5e2e1] min-h-screen font-body relative">
      {/* HEADER + FILTER BAR */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl sm:text-5xl font-headline tracking-wider text-[#e5e2e1] uppercase">
            Athletes Directory
          </h1>
          <p className="text-[#e0c0b1] opacity-75 text-xs sm:text-sm mt-1">
            Real-time telemetry and roster of registered athletes.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-auto">
          {/* Row 1: Search + View toggle */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search athlete..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm sm:text-base text-[#e5e2e1] bg-[#050505] border-[#2A2A2A] focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none transition-all"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-[#111111] border-[#2A2A2A] rounded-xl p-1">
              <button
                onClick={() => setViewMode("card")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "card"
                    ? "bg-[#f97316] text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#f97316] text-white"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <TableIcon size={18} />
              </button>
            </div>
          </div>

          {/* Row 2: Plan filter + Sort in one line */}
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {/* Plan Filter */}
            <div className="relative flex-1 min-w-[150px]">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full bg-[#111111] border-[#2A2A2A] rounded-xl py-2 pl-4 pr-9 text-sm text-[#e5e2e1] outline-none focus:border-[#f97316] cursor-pointer"
              >
                <option value="All">All Plans</option>
                {plans
                  .sort((a, b) => {
                    const aDays =
                      a.validity * (a.validityType === "days" ? 1 : 30);
                    const bDays =
                      b.validity * (b.validityType === "days" ? 1 : 30);
                    return aDays - bDays;
                  })
                  .map((plan) => (
                    <option key={plan._id} value={plan.name}>
                      {plan.name}
                    </option>
                  ))}
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative flex-1 min-w-[150px]">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "name" | "expiry" | "newest")
                }
                className="w-full bg-[#111111] border-[#2A2A2A] rounded-xl py-2 pl-4 pr-9 text-sm text-[#e5e2e1] outline-none focus:border-[#f97316] cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="expiry">Sort by Expiring Soon</option>
                <option value="newest">Sort by Newest Renewal</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Total Members */}
      <div className="flex items-center mb-6">
        <span className="ml-auto text-lg sm:text-xl font-headline tracking-widest text-[#f97316]">
          TOTAL REGISTRY: {filteredMembers.length}
        </span>
      </div>

      {/* View Mode */}
      {viewMode === "card" ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member, index) => {
            const expiryDate = calculateExpiryDate(member);
            const today = new Date();
            const diffDays = Math.ceil(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            const status = getMembershipStatus(member);

            return (
              <div
                key={member._id}
                className="glass-card rounded-xl p-6 hover:scale-[1.02] cursor-pointer relative flex flex-col justify-between min-h-[220px]"
                onClick={() => router.push(`/${tenantSlug}/members/${member._id}`)}
              >
                <div>
                  <span className="absolute top-4 left-4 text-xs font-mono text-zinc-500">
                    #{index + 1}
                  </span>

                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === "Active" ? "bg-[#22c55e] animate-pulse" : "bg-red-500"
                      }`}
                    ></span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                        getPaymentStatus(member) === "Paid"
                          ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/25"
                          : "bg-red-500/10 text-red-400 border border-red-500/25"
                      }`}
                    >
                      {getPaymentStatus(member)}
                    </span>
                  </div>

                  <h2 className="text-xl font-headline tracking-wider text-[#e5e2e1] flex items-center gap-2 mt-4 mb-4">
                    <User size={20} className="text-[#f97316]" />
                    {member.name}
                  </h2>

                  <div className="space-y-2 text-[#e0c0b1]/80 text-sm">
                    <p className="flex items-center gap-2">
                      <Calendar size={15} className="text-zinc-500" />
                      <span>Joined: {getRenewalDate(member).toLocaleDateString("en-GB")}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CreditCard size={15} className="text-zinc-500" />
                      <span className="px-2.5 py-0.5 bg-white/5 text-zinc-300 rounded-full text-xs font-semibold border border-white/5">
                        {getPlanDisplay(member)}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={15} className="text-zinc-500" />
                      <span>{member.mobile}</span>
                    </p>
                  </div>
                </div>

                {member.plan?.toLowerCase() !== "no plan" && diffDays < 8 && (
                  <div
                    className={`mt-4 self-end px-3 py-1 rounded-lg text-xs font-semibold shadow-md ${
                      diffDays < 0
                        ? "bg-red-950/40 text-red-400 border border-red-500/25"
                        : "bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/25"
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
        <div className="table-scroll rounded-xl border-[#2A2A2A]/80 overflow-hidden">
          <table className="w-full text-xs sm:text-sm">
            <thead className="table-thead">
              <tr>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Sr.No.</th>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Name</th>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Mobile</th>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Plan</th>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Joined</th>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Expiry</th>
                <th className="p-3 text-center font-bold uppercase tracking-wider">Payment</th>
                <th className="p-3 text-left font-bold uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredMembers.map((member, index) => {
                const status = getMembershipStatus(member);
                const paymentStatus = getPaymentStatus(member);
                return (
                  <tr
                    key={member._id}
                    className="table-row cursor-pointer"
                    onClick={() => router.push(`/${tenantSlug}/members/${member._id}`)}
                  >
                    <td className="p-3 text-zinc-500">{index + 1}</td>
                    <td className="p-3 font-semibold text-[#e5e2e1]">{member.name}</td>
                    <td className="p-3 text-zinc-400">{member.mobile}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-white/5 border border-white/5 rounded-full text-xs text-zinc-300">
                        {getPlanDisplay(member)}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400">
                      {getRenewalDate(member).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-3 text-zinc-400">
                      {calculateExpiryDate(member).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            paymentStatus === "Paid"
                              ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/25"
                              : "bg-red-500/10 text-red-400 border border-red-500/25"
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === "Active" ? "bg-[#22c55e]" : "bg-red-500"
                          }`}
                        ></span>
                        <span>{status}</span>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card rounded-xl p-6 shadow-2xl w-full max-w-md mx-4 relative border-[#2A2A2A]">
            <h3 className="text-lg font-headline tracking-wider text-[#e5e2e1] mb-4">
              Are you sure you want to delete {selectedMember.name}?
            </h3>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm cursor-pointer"
              >
                Yes, Delete
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-zinc-800 text-[#e5e2e1] border border-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-700 transition text-sm cursor-pointer"
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
