"use client";

import { useEffect, useState } from "react";
import {
  User,
  CreditCard,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Users,
  PlusCircle,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

type Salary = {
  amountPaid: number;
  paidOn: string;
};

type Coach = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  joinDate?: string;
  salaryHistory?: Salary[];
};

export default function CoachPage() {
  const router = useRouter();
  const { tenantSlug } = useParams();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCoach, setNewCoach] = useState({
    name: "",
    mobile: "",
    email: "",
    joinDate: "",
  });

  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coach")
      .then((res) => res.json())
      .then((data) => data.success && setCoaches(data.coaches))
      .catch(() => setCoaches([]));
  }, []);

  const getTotalSalary = (coach: Coach) => {
    if (!coach.salaryHistory || coach.salaryHistory.length === 0) return 0;
    return coach.salaryHistory.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
  };

  const getLastPaymentDate = (coach: Coach) => {
    if (!coach.salaryHistory || coach.salaryHistory.length === 0) return "-";
    const latest = [...coach.salaryHistory].sort(
      (a, b) => new Date(b.paidOn).getTime() - new Date(a.paidOn).getTime()
    )[0];
    return new Date(latest.paidOn).toLocaleDateString("en-GB");
  };

  const filteredCoaches = coaches.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();

    const mobileRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newCoach.name.trim()) {
      setPopupMessage("⚠️ Name cannot be empty");
      return;
    }

    if (!mobileRegex.test(newCoach.mobile)) {
      setPopupMessage("⚠️ Mobile number must be exactly 10 digits");
      return;
    }

    if (newCoach.email && !emailRegex.test(newCoach.email)) {
      setPopupMessage("⚠️ Invalid email address");
      return;
    }

    if (!newCoach.joinDate) {
      setPopupMessage("⚠️ Please select a join date");
      return;
    }

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoach),
      });
      const data = await res.json();
      if (data.success) {
        setCoaches((prev) => [...prev, data.coach]);
        setNewCoach({ name: "", mobile: "", email: "", joinDate: "" });
        setShowAddModal(false);
        setPopupMessage("✅ Coach added successfully!");
      } else {
        setPopupMessage("❌ Error: " + (data.error || "Failed to add coach"));
      }
    } catch (err) {
      console.error(err);
      setPopupMessage("❌ Failed to add coach. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] leading-tight uppercase">
              View Coaches
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage coach profiles, salaries and join dates.
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-2 sm:flex-row sm:justify-end sm:gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search coach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark w-full pl-10 pr-4 py-2 rounded-lg text-sm sm:text-base"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-[#050505] border-[#2A2A2A] rounded-xl px-1.5 py-1.5 shadow-sm">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg cursor-pointer transition ${
                viewMode === "card"
                  ? "bg-[#f97316] text-white"
                  : "text-zinc-500 hover:bg-white/5"
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg cursor-pointer transition ${
                viewMode === "table"
                  ? "bg-[#f97316] text-white"
                  : "text-zinc-500 hover:bg-white/5"
              }`}
            >
              <TableIcon size={18} />
            </button>
          </div>

          {/* Add Coach */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-headline tracking-wider text-white shadow cursor-pointer whitespace-nowrap uppercase"
          >
            <PlusCircle size={18} /> Add
          </button>
        </div>
      </div>

      {/* Total count */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm text-zinc-400 font-medium">
          Showing {filteredCoaches.length} of {coaches.length} coaches
        </span>
        <span className="text-lg sm:text-xl lg:text-2xl font-headline tracking-wider text-[#f97316] uppercase">
          Total Coaches: {filteredCoaches.length}
        </span>
      </div>

      {/* View mode */}
      {viewMode === "card" ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCoaches.map((coach, index) => (
            <div
              key={coach._id}
              className="glass-card rounded-xl p-5 sm:p-6 border-[#2A2A2A] hover:border-zinc-700/80 hover:scale-[1.02] transition duration-300 cursor-pointer relative"
              onClick={() => router.push(`/${tenantSlug}/coach/${coach._id}`)}
            >
              <span className="absolute top-3 right-4 text-xs font-semibold text-zinc-500 font-headline">
                #{index + 1}
              </span>

              <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] flex items-center gap-2 mb-4 break-words">
                <User size={22} className="text-[#f97316]" /> {coach.name}
              </h2>

              <div className="space-y-2 text-zinc-300 text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-400" />
                  <span className="font-medium text-[#e5e2e1]">Joined:</span>
                  <span>
                    {coach.joinDate
                      ? new Date(coach.joinDate).toLocaleDateString("en-GB")
                      : "-"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[#22c55e]" />
                  <span className="font-medium text-[#e5e2e1]">Total Salary:</span>
                  <span className="font-semibold text-[#22c55e]">₹{getTotalSalary(coach).toLocaleString("en-IN")}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-orange-400" />
                  <span className="font-medium text-[#e5e2e1]">Last Payment:</span>
                  <span>{getLastPaymentDate(coach)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-400" />
                  <span className="font-medium text-[#e5e2e1]">Mobile:</span>
                  <span>{coach.mobile}</span>
                </p>
                {coach.email && (
                  <p className="text-zinc-500 text-xs sm:text-sm break-all pt-1 border-t border-zinc-900 mt-2">
                    {coach.email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <div className="rounded-xl border-[#2A2A2A] overflow-hidden bg-[#0A0A0A]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="table-thead">
              <tr>
                  <th className="px-4 py-3.5">Sr. No.</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Mobile</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Join Date</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Total Salary (₹)</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Last Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredCoaches.map((coach, index) => (
                  <tr
                    key={coach._id}
                    className="hover:bg-white/5 transition cursor-pointer"
                    onClick={() => router.push(`/${tenantSlug}/coach/${coach._id}`)}
                  >
                    <td className="px-4 py-3.5 text-zinc-500">{index + 1}</td>
                    <td className="px-4 py-3.5 font-semibold text-[#e5e2e1]">{coach.name}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400">{coach.mobile}</td>
                    <td className="px-4 py-3.5 break-all text-zinc-400">{coach.email || "-"}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400">
                      {coach.joinDate
                        ? new Date(coach.joinDate).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[#22c55e] font-semibold">
                      ₹{getTotalSalary(coach).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-zinc-400">
                      {getLastPaymentDate(coach)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Coach Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative border-[#2A2A2A] text-[#e5e2e1]">
            <button
              className="absolute top-4 right-5 text-2xl text-zinc-450 hover:text-white cursor-pointer"
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </button>

            <h2 className="text-2xl sm:text-3xl font-headline tracking-wider text-[#f97316] mb-5 sm:mb-7 uppercase">
              Add New Coach
            </h2>

            <form
              onSubmit={handleAddCoach}
              className="flex flex-col gap-4 sm:gap-5 text-sm sm:text-base text-left"
            >
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={newCoach.name}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, name: e.target.value })
                  }
                  required
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Mobile
                </label>
                <input
                  type="text"
                  placeholder="Enter mobile number"
                  value={newCoach.mobile}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, mobile: e.target.value })
                  }
                  required
                  className={`input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base ${
                    newCoach.mobile && !/^\d{10}$/.test(newCoach.mobile)
                      ? "border-red-500"
                      : ""
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newCoach.email}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, email: e.target.value })
                  }
                  className={`input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base ${
                    newCoach.email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCoach.email)
                      ? "border-red-500"
                      : ""
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Join Date
                </label>
                <input
                  type="date"
                  value={newCoach.joinDate}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, joinDate: e.target.value })
                  }
                  required
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
                />
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 mt-6">
                <button
                  type="submit"
                  className="btn-primary px-5 sm:px-7 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer flex items-center gap-2 uppercase"
                >
                  <PlusCircle size={18} /> Add Coach
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary px-5 sm:px-7 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {popupMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/60 px-3">
          <div className="glass-card px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl text-center max-w-sm w-full border-[#2A2A2A] text-[#e5e2e1]">
            <p className="text-lg font-headline tracking-wider mb-4 whitespace-pre-line">
              {popupMessage}
            </p>
            <button
              onClick={() => setPopupMessage(null)}
              className="btn-primary px-6 py-2 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
