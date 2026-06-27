"use client";

import { useEffect, useState } from "react";
import { Calendar, Receipt, PlusCircle, Edit } from "lucide-react";

type Bill = {
  _id: string;
  month: string;
  year: number;
  amount: number;
  date: string;
};

export default function ElectricityBillReportPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [formId, setFormId] = useState<string | null>(null);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState("");

  // ✅ Feedback modal state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Auto-close feedback modal
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch bills
  const fetchBills = async () => {
    try {
      const res = await fetch("/api/electricity-bill");
      const data = await res.json();
      if (data.success) {
        const sorted = data.bills.sort((a: Bill, b: Bill) => {
          if (b.year !== a.year) return b.year - a.year;
          return months.indexOf(b.month) - months.indexOf(a.month);
        });
        setBills(sorted);
      } else {
        setFeedback({ type: "error", message: "Failed to load bills ❌" });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Error fetching bills ❌" });
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // Open modal for add or edit
  const openModal = (bill?: Bill) => {
    if (bill) {
      setFormId(bill._id);
      setMonth(bill.month);
      setYear(bill.year);
      setAmount(bill.amount.toString());
    } else {
      setFormId(null);
      setMonth("");
      setYear(new Date().getFullYear());
      setAmount("");
    }
    setModalOpen(true);
  };

  // Add or update bill
  const handleSubmit = async () => {
    if (!month || !amount) {
      setFeedback({ type: "error", message: "Please fill all fields ❌" });
      return;
    }

    // Duplicate check for new bills
    if (!formId) {
      const duplicate = bills.find((b) => b.month === month && b.year === year);
      if (duplicate) {
        setFeedback({
          type: "error",
          message: "A bill for this month and year already exists! ⚠️",
        });
        return;
      }
    }

    const method = formId ? "PUT" : "POST";
    const url = formId
      ? `/api/electricity-bill/${formId}`
      : "/api/electricity-bill";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, amount: Number(amount) }),
      });

      const data = await res.json();
      if (data.success) {
        setFormId(null);
        setMonth("");
        setAmount("");
        setModalOpen(false);
        fetchBills();

        setFeedback({
          type: "success",
          message: formId
            ? "Bill updated successfully ✅"
            : "Bill added successfully ✅",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to save bill ❌",
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to save bill ❌" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body text-left">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <Receipt size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] uppercase">
            Electricity Bill Report
          </h1>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase whitespace-nowrap"
        >
          <PlusCircle size={18} /> Add New
        </button>
      </div>

      {/* Bills Table */}
      <div className="glass-card rounded-2xl border border-zinc-800 p-4 sm:p-6 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-6 flex items-center gap-2 uppercase">
          <Calendar className="text-[#f97316]" size={20} /> Bills History
        </h2>
        <div className="w-full overflow-x-auto">
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#0A0A0A]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[#e0c0b1] font-headline text-base tracking-wider uppercase">
                  <th className="px-6 py-3.5 text-center">Month</th>
                  <th className="px-6 py-3.5 text-center">Year</th>
                  <th className="px-6 py-3.5 text-center">Amount</th>
                  <th className="px-6 py-3.5 text-center">Date Entered</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {bills.map((bill) => (
                  <tr
                    key={bill._id}
                    className="hover:bg-white/5 transition"
                  >
                    <td className="px-6 py-3.5 text-center font-semibold text-[#e5e2e1]">
                      {bill.month}
                    </td>
                    <td className="px-6 py-3.5 text-center text-zinc-400">
                      {bill.year}
                    </td>
                    <td className="px-6 py-3.5 text-center text-zinc-400 font-semibold">
                      ₹ {bill.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-3.5 text-center text-zinc-400">
                      {new Date(bill.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openModal(bill)}
                          className="btn-secondary px-4 py-1.5 rounded-xl font-headline text-sm tracking-wider text-white shadow cursor-pointer uppercase flex items-center gap-1.5"
                        >
                          <Edit size={14} /> Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bills.length === 0 && (
              <p className="text-zinc-500 my-8 text-center text-sm sm:text-base font-medium uppercase tracking-wider">
                No bills recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-lg w-[95%] sm:w-full border border-zinc-800 text-left">
            <h3 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-5 flex items-center gap-3 uppercase">
              <PlusCircle className="text-[#f97316]" size={22} />
              {formId ? "Edit Bill" : "Add New Bill"}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Month
                </label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base cursor-pointer text-[#e5e2e1]"
                >
                  <option value="" className="bg-[#121212]">Select Month</option>
                  {months.map((m) => (
                    <option key={m} value={m} className="bg-[#121212]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base"
                  placeholder="Year"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base"
                  placeholder="Amount (₹)"
                />
              </div>
              <div className="flex justify-end gap-3 sm:gap-4 mt-6">
                <button
                  onClick={handleSubmit}
                  className="btn-primary px-5 sm:px-6 py-2.5 rounded-xl font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  {formId ? "Save Changes" : "Add Bill"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary px-5 sm:px-6 py-2.5 rounded-xl font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Feedback Modal */}
      {feedback && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-3">
          <div
            className={`p-6 rounded-2xl shadow-2xl text-center max-w-sm w-[90%] sm:w-full border transition-all ${
              feedback.type === "success"
                ? "bg-green-950/20 text-[#22c55e] border-[#22c55e]/25 backdrop-blur-md"
                : "bg-red-950/20 text-red-400 border border-red-500/25 backdrop-blur-md"
            }`}
          >
            <h3 className="text-2xl font-headline tracking-wider mb-2">
              {feedback.type === "success" ? "✅ Success" : "❌ Error"}
            </h3>
            <p className="text-sm sm:text-lg font-medium">{feedback.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
