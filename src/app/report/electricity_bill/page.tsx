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

  // Fetch bills
  const fetchBills = async () => {
    const res = await fetch("/api/electricity-bill");
    const data = await res.json();
    if (data.success) {
      // Sort by year descending, then month descending
      const sorted = data.bills.sort((a: Bill, b: Bill) => {
        if (b.year !== a.year) return b.year - a.year;
        return months.indexOf(b.month) - months.indexOf(a.month);
      });
      setBills(sorted);
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
    if (!month || !amount) return alert("Please fill all fields");

    // Duplicate check for new bills
    if (!formId) {
      const duplicate = bills.find((b) => b.month === month && b.year === year);
      if (duplicate)
        return alert("A bill for this month and year already exists!");
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
      } else {
        alert(data.message || "Failed to save bill");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save bill");
    }
  };

  return (
    <div className="p-6 bg-[#F5F7FA] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <Receipt size={40} className="text-[#0A2463]" />
          <h1 className="text-4xl font-bold text-[#0A2463]">
            Electricity Bill Report
          </h1>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-[#FFC107] text-[#212529] px-6 py-3 rounded-xl shadow hover:bg-[#e0a800] hover:scale-105 transition font-semibold"
        >
          <PlusCircle /> Add New
        </button>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="text-[#FFC107]" /> Bills History
        </h2>
        <table className="min-w-full divide-y divide-gray-300 rounded-2xl overflow-hidden">
          <thead className="bg-yellow-500 text-white">
            <tr>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Month
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Year
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Amount
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Date Entered
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill, idx) => (
              <tr
                key={bill._id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"
                } hover:bg-[#FFC107]/20`}
              >
                <td className="px-6 py-4 text-xl text-center font-semibold">
                  {bill.month}
                </td>
                <td className="px-6 py-4 text-xl text-center font-semibold">
                  {bill.year}
                </td>
                <td className="px-6 py-4 text-xl text-center font-semibold">
                  ₹ {bill.amount}
                </td>
                <td className="px-6 py-4 text-xl text-center font-semibold">
                  {new Date(bill.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-6 py-4 text-center flex justify-center gap-2">
                  <button
                    onClick={() => openModal(bill)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 transition flex items-center gap-1 font-semibold"
                  >
                    <Edit size={16} /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && (
          <p className="text-gray-500 mt-4 text-center">
            No bills recorded yet.
          </p>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-12 rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200">
            <h3 className="text-3xl font-bold text-[#0A2463] mb-6 flex items-center gap-3">
              <PlusCircle className="text-[#FFC107]" />{" "}
              {formId ? "Edit Bill" : "Add New Bill"}
            </h3>
            <div className="flex flex-col gap-6">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border rounded-xl px-4 py-3 text-lg shadow w-full"
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="border rounded-xl px-4 py-3 text-lg shadow w-full"
                placeholder="Year"
              />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border rounded-xl px-4 py-3 text-lg shadow w-full"
                placeholder="Amount (₹)"
              />
              <div className="flex justify-end gap-4 mt-2">
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow"
                >
                  {formId ? "Save Changes" : "Add Bill"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
