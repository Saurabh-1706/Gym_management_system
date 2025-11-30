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
    <div className="min-h-screen bg-[#E9ECEF] px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#FFC107] text-white shadow-md">
            <Users size={26} />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A2463] leading-tight">
              View Coaches
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Manage coach profiles, salaries and join dates.
            </p>
          </div>
        </div>

        <div
          className="
    flex 
    flex-row               /* ⬅️ Now all items in a single line on mobile */
    items-center
    justify-between
    gap-2
    sm:flex-row sm:justify-end sm:gap-4
    w-full
  "
        >
          {/* Search — stays full width on mobile */}
          <div className="relative flex-1 sm:flex-none sm:w-56">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-600">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search coach..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-2xl border bg-gray-100 border-gray-400 shadow-sm w-full 
      text-sm sm:text-base text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#0A2463] 
      transition-all duration-300"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-400 rounded-2xl px-1.5 py-1 shadow-sm">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-xl ${
                viewMode === "card"
                  ? "bg-[#FFC107] text-white"
                  : "text-gray-400 hover:bg-gray-200"
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl ${
                viewMode === "table"
                  ? "bg-[#FFC107] text-white"
                  : "text-gray-400 hover:bg-gray-200"
              }`}
            >
              <TableIcon size={18} />
            </button>
          </div>

          {/* Add Coach */}
          <button
            onClick={() => setShowAddModal(true)}
            className="
      flex items-center justify-center gap-1
      bg-[#FFC107] text-white px-3 py-2 rounded-xl
      hover:bg-[#e0ac00] transition shadow
      text-sm font-semibold
      whitespace-nowrap
    "
          >
            <PlusCircle size={18} /> Add
          </button>
        </div>
      </div>

      {/* Total count */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <span className="text-sm sm:text-base text-gray-600">
          Showing {filteredCoaches.length} of {coaches.length} coaches
        </span>
        <span className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0A2463]">
          Total Coaches: {filteredCoaches.length}
        </span>
      </div>

      {/* View mode */}
      {viewMode === "card" ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCoaches.map((coach, index) => (
            <div
              key={coach._id}
              className="bg-white rounded-2xl shadow-md p-5 sm:p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition duration-300 cursor-pointer relative"
              onClick={() => router.push(`/coach/${coach._id}`)}
            >
              <span className="absolute top-3 left-4 text-xs sm:text-sm font-semibold text-gray-500">
                #{index + 1}
              </span>

              <h2 className="text-xl sm:text-2xl font-bold text-[#0A2463] flex items-center gap-2 pl-3 pr-2 mb-3">
                <User size={22} className="text-[#FFC107]" /> {coach.name}
              </h2>

              <div className="space-y-1.5 sm:space-y-2 text-[#212529] px-3 text-sm sm:text-base">
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  <span className="font-medium">Joined:</span>
                  <span>
                    {coach.joinDate
                      ? new Date(coach.joinDate).toLocaleDateString("en-GB")
                      : "-"}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard size={16} className="text-green-600" />
                  <span className="font-medium">Total Salary:</span>
                  <span>₹{getTotalSalary(coach).toLocaleString("en-IN")}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar size={16} className="text-orange-500" />
                  <span className="font-medium">Last Payment:</span>
                  <span>{getLastPaymentDate(coach)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-500" />
                  <span className="font-medium">Mobile:</span>
                  <span>{coach.mobile}</span>
                </p>
                {coach.email && (
                  <p className="text-gray-600 text-xs sm:text-sm break-all">
                    {coach.email}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-scroll rounded-2xl border border-slate-100">
          <table className="w-full text-xs sm:text-sm lg:text-base">
            <thead className="bg-[#0A2463] text-white text-xs sm:text-sm lg:text-base">
              <tr>
                <th className="p-3 sm:p-4">Sr. No.</th>
                <th className="p-3 sm:p-4">Name</th>
                <th className="p-3 sm:p-4">Mobile</th>
                <th className="p-3 sm:p-4">Email</th>
                <th className="p-3 sm:p-4 whitespace-nowrap">Join Date</th>
                <th className="p-3 sm:p-4 whitespace-nowrap">
                  Total Salary (₹)
                </th>
                <th className="p-3 sm:p-4 whitespace-nowrap">Last Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoaches.map((coach, index) => (
                <tr
                  key={coach._id}
                  className="border-b text-xs sm:text-sm lg:text-base hover:bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/coach/${coach._id}`)}
                >
                  <td className="p-3 sm:p-4">{index + 1}</td>
                  <td className="p-3 sm:p-4 font-semibold">{coach.name}</td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {coach.mobile}
                  </td>
                  <td className="p-3 sm:p-4 break-all">{coach.email || "-"}</td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {coach.joinDate
                      ? new Date(coach.joinDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    ₹{getTotalSalary(coach).toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 sm:p-4 whitespace-nowrap">
                    {getLastPaymentDate(coach)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Coach Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-3">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-5 text-2xl text-gray-500 hover:text-red-600"
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </button>

            <h2 className="text-2xl sm:text-3xl font-bold mb-5 sm:mb-7 text-gray-800">
              Add New Coach
            </h2>

            <form
              onSubmit={handleAddCoach}
              className="flex flex-col gap-4 sm:gap-5 text-sm sm:text-base"
            >
              <div>
                <label className="block mb-1.5 font-semibold text-gray-700">
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
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-gray-700">
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
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base ${
                    newCoach.mobile && !/^\d{10}$/.test(newCoach.mobile)
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newCoach.email}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, email: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base ${
                    newCoach.email &&
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCoach.email)
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-gray-700">
                  Join Date
                </label>
                <input
                  type="date"
                  value={newCoach.joinDate}
                  onChange={(e) =>
                    setNewCoach({ ...newCoach, joinDate: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-yellow-500 text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-wrap gap-3 justify-end mt-4">
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-5 sm:px-7 py-2.5 rounded-xl flex items-center gap-2 hover:bg-yellow-600 transition text-sm sm:text-base font-semibold"
                >
                  <PlusCircle size={18} /> Add Coach
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-200 text-gray-800 px-5 sm:px-7 py-2.5 rounded-xl hover:bg-gray-300 transition text-sm sm:text-base font-semibold"
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
        <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/40 px-3">
          <div className="bg-white px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl text-center max-w-sm w-full">
            <p className="text-sm sm:text-lg font-semibold text-[#15145a] whitespace-pre-line">
              {popupMessage}
            </p>
            <button
              onClick={() => setPopupMessage(null)}
              className="mt-4 bg-yellow-400 text-[#15145a] px-5 sm:px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition text-sm sm:text-base"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
