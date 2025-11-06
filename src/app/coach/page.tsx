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
import { useRouter } from "next/navigation";

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

  // ✅ Fetch coaches
  useEffect(() => {
    fetch("/api/coach")
      .then((res) => res.json())
      .then((data) => data.success && setCoaches(data.coaches))
      .catch(() => setCoaches([]));
  }, []);

  // ✅ Helper functions
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

  // ✅ Filter by search only (no sorting)
  const filteredCoaches = coaches.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Add coach
  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();

    const mobileRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newCoach.name.trim()) {
      alert("Name cannot be empty");
      return;
    }

    if (!mobileRegex.test(newCoach.mobile)) {
      alert("Mobile number must be exactly 10 digits");
      return;
    }

    if (newCoach.email && !emailRegex.test(newCoach.email)) {
      alert("Invalid email address");
      return;
    }

    if (!newCoach.joinDate) {
      alert("Please select a join date");
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
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add coach");
    }
  };

  return (
    <div className="p-6 relative bg-[#E9ECEF]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[42px] font-bold text-[#0A2463] flex items-center gap-3">
          <Users size={42} className="text-[#FFC107]" />
          View Coaches
        </h2>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-600">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search coach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl border bg-gray-100 border-gray-400 shadow-sm w-52 text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#0A2463] transition-all duration-300"
            />
          </div>

          {/* View toggle */}
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

          {/* Add Coach Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#FFC107] text-white px-6 py-2 rounded-2xl hover:bg-[#e0ac00] transition shadow text-lg font-semibold"
          >
            <PlusCircle size={20} /> Add Coach
          </button>
        </div>
      </div>

      {/* Total Count */}
      <div className="flex items-center mb-6">
        <span className="ml-auto text-2xl font-semibold text-[#0A2463]">
          Total Coaches: {filteredCoaches.length}
        </span>
      </div>

      {/* View Mode */}
      {viewMode === "card" ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCoaches.map((coach, index) => (
            <div
              key={coach._id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition duration-300 cursor-pointer relative"
              onClick={() => router.push(`/coach/${coach._id}`)}
            >
              <span className="absolute top-3 left-3 text-sm font-semibold text-gray-500">
                #{index + 1}
              </span>

              <h2 className="text-2xl font-bold text-[#0A2463] flex items-center gap-2 px-4 mb-3">
                <User size={24} className="text-[#FFC107]" /> {coach.name}
              </h2>

              <div className="space-y-2 text-[#212529] px-4 text-[16px]">
                <p className="flex items-center gap-2 text-lg">
                  <Calendar size={18} className="text-blue-500" />
                  Joined:{" "}
                  {coach.joinDate
                    ? new Date(coach.joinDate).toLocaleDateString("en-GB")
                    : "-"}
                </p>
                <p className="flex items-center gap-2 text-lg">
                  <CreditCard size={18} className="text-green-600" />
                  Total Salary: ₹{getTotalSalary(coach).toLocaleString("en-IN")}
                </p>
                <p className="flex items-center gap-2 text-lg">
                  <Calendar size={18} className="text-orange-500" />
                  Last Payment: {getLastPaymentDate(coach)}
                </p>
                <p className="flex items-center gap-2 text-lg">
                  <CreditCard size={18} className="text-purple-500" />
                  {coach.mobile}
                </p>
                {coach.email && (
                  <p className="text-gray-600 text-sm">{coach.email}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FFC107] text-white text-[22px]">
              <tr>
                <th className="p-3">Sr.No.</th>
                <th className="p-3">Name</th>
                <th className="p-3">Mobile</th>
                <th className="p-3">Email</th>
                <th className="p-3">Join Date</th>
                <th className="p-3">Total Salary (₹)</th>
                <th className="p-3">Last Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.map((coach, index) => (
                <tr
                  key={coach._id}
                  className="border-b text-[18px] hover:bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/coach/${coach._id}`)}
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-semibold">{coach.name}</td>
                  <td className="p-3">{coach.mobile}</td>
                  <td className="p-3">{coach.email || "-"}</td>
                  <td className="p-3">
                    {coach.joinDate
                      ? new Date(coach.joinDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="p-3">
                    ₹{getTotalSalary(coach).toLocaleString("en-IN")}
                  </td>
                  <td className="p-3">{getLastPaymentDate(coach)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Coach Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-brightness-90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-3xl shadow-2xl w-full max-w-lg relative">
            <button
              className="absolute top-5 right-6 text-gray-500 text-3xl hover:text-red-600"
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </button>
            <h2 className="text-4xl font-bold mb-8 text-gray-800">
              Add New Coach
            </h2>
            <form
              onSubmit={handleAddCoach}
              className="flex flex-col gap-6 text-lg"
            >
              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-xl">
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
                  className="w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-lg"
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-xl">
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
                  className={`w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-lg ${
                    newCoach.mobile && !/^\d{10}$/.test(newCoach.mobile)
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-xl">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newCoach.email}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, email: e.target.value })
                  }
                  className={`w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-lg ${
                    newCoach.email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCoach.email)
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>

              {/* ✅ Join Date Field */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700 text-xl">
                  Join Date
                </label>
                <input
                  type="date"
                  value={newCoach.joinDate}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, joinDate: e.target.value })
                  }
                  required
                  className="w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-lg"
                />
              </div>

              <div className="flex gap-4 justify-end mt-6">
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-8 py-4 rounded-xl flex items-center gap-3 hover:bg-yellow-600 transition text-lg font-semibold"
                >
                  <PlusCircle size={24} /> Add Coach
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-200 text-gray-800 px-8 py-4 rounded-xl hover:bg-gray-300 transition text-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
