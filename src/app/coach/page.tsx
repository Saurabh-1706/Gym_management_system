"use client";

import { useState, useEffect } from "react";
import { PlusCircle, CreditCard, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";

type Coach = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  salaryHistory?: { amountPaid: number; paidOn: string }[];
};

export default function CoachPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [newCoach, setNewCoach] = useState({ name: "", mobile: "", email: "" });
  const [payout, setPayout] = useState({ amount: 0, date: "" });

  // Fetch coaches
  useEffect(() => {
    fetch("/api/coach")
      .then((res) => res.json())
      .then((data) => data.success && setCoaches(data.coaches));
  }, []);

  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
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

    // Add coach
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoach),
      });
      const data = await res.json();
      if (data.success) {
        setCoaches((prev) => [...prev, data.coach]);
        setNewCoach({ name: "", mobile: "", email: "" });
        setShowAddModal(false);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to add coach");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coach?")) return;
    const res = await fetch(`/api/coach/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setCoaches((prev) => prev.filter((c) => c._id !== id));
    } else {
      alert("Error: " + data.error);
    }
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoachId) return;
    const res = await fetch(`/api/coach/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId: selectedCoachId, ...payout }),
    });
    const data = await res.json();
    if (data.success) {
      setCoaches(data.coaches);
      setShowPayoutForm(false);
      setSelectedCoachId(null);
      setPayout({ amount: 0, date: "" });
    } else {
      alert("Error: " + data.error);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <User size={36} className="text-yellow-500" />
          <h1 className="text-4xl font-bold text-gray-800">Coaches</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition shadow text-lg"
        >
          <PlusCircle size={20} /> Add Coach
        </button>
      </div>

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

      {/* Pay Salary Form */}
      {showPayoutForm && selectedCoachId && (
        <div className="fixed inset-0 backdrop-brightness-90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            {/* Close button */}
            <button
              className="absolute top-3 right-4 text-gray-500 text-xl hover:text-red-600"
              onClick={() => {
                setShowPayoutForm(false);
                setSelectedCoachId(null);
                setPayout({ amount: 0, date: "" });
              }}
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-6 text-[#15145a]">
              Pay Salary to{" "}
              {coaches.find((c) => c._id === selectedCoachId)?.name}
            </h2>

            <form
              onSubmit={handlePayout}
              className="flex flex-col gap-5 text-lg"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="amount" className="font-semibold text-gray-700">
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={payout.amount}
                  onChange={(e) =>
                    setPayout({ ...payout, amount: +e.target.value })
                  }
                  required
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 text-lg"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="date" className="font-semibold text-gray-700">
                  Payment Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={payout.date}
                  onChange={(e) =>
                    setPayout({ ...payout, date: e.target.value })
                  }
                  required
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 text-lg"
                />
              </div>

              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-green-600 transition mt-4"
              >
                <CreditCard size={20} /> Pay
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Coaches Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-x-auto mt-8">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-yellow-500 text-white text-[20px] uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Sr.No.</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Mobile</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y font-semibold divide-gray-200 text-[20px]">
            {coaches.map((coach, index) => (
              <tr key={coach._id} className={`transition hover:bg-gray-100`}>
                <td className="px-6 py-4">{index + 1}</td>
                <td
                  className="px-6 py-4 font-semibold cursor-pointer hover:text-blue-800"
                  onClick={() => router.push(`/coach/${coach._id}`)}
                >
                  {coach.name}
                </td>
                <td className="px-6 py-4">{coach.mobile}</td>
                <td className="px-6 py-4">{coach.email || "-"}</td>
                <td className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedCoachId(coach._id);
                      setShowPayoutForm(true);
                      setShowAddModal(false);
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl flex items-center gap-1"
                  >
                    <CreditCard size={16} /> Pay
                  </button>
                  <button
                    onClick={() => handleDelete(coach._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-1"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
