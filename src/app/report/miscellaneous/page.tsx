"use client";

import { useEffect, useState } from "react";
import { Calendar, Receipt, PlusCircle, Trash2, Edit } from "lucide-react";

type Cost = {
  _id: string;
  name: string;
  date: string;
  amount: number;
};

export default function MiscellaneousPage() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formId, setFormId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");

  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");

  // ✅ Feedback modal state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-close feedback modal
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Fetch costs
  const fetchCosts = async () => {
    try {
      const res = await fetch("/api/miscellaneous");
      const data = await res.json();
      if (data.success) {
        // newest first
        const sorted = [...data.costs].sort(
          (a: Cost, b: Cost) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setCosts(sorted);
      } else {
        setFeedback({
          type: "error",
          message: "Failed to load costs ❌",
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: "Error fetching costs ❌",
      });
    }
  };

  useEffect(() => {
    fetchCosts();
  }, []);

  // Open modal for add or edit
  const openModal = (cost?: Cost) => {
    if (cost) {
      setFormId(cost._id);
      setName(cost.name);
      setDate(cost.date.slice(0, 10));
      setAmount(cost.amount.toString());
    } else {
      setFormId(null);
      setName("");
      setDate("");
      setAmount("");
    }
    setModalOpen(true);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!name || !date || !amount) {
      setFeedback({ type: "error", message: "Please fill all fields ❌" });
      return;
    }

    const method = formId ? "PUT" : "POST";
    const url = formId ? `/api/miscellaneous/${formId}` : "/api/miscellaneous";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, date, amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        fetchCosts();
        setFeedback({
          type: "success",
          message: formId
            ? "Cost updated successfully ✅"
            : "Cost added successfully ✅",
        });
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to save cost ❌",
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: "Error saving cost ❌",
      });
    }
  };

  // Delete cost (after confirmation)
  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/miscellaneous/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCosts();
        setFeedback({
          type: "success",
          message: "Cost deleted successfully 🗑️",
        });
      } else {
        setFeedback({
          type: "error",
          message: "Failed to delete cost ❌",
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: "Error deleting cost ❌",
      });
    } finally {
      setDeleteId(null);
    }
  };

  // Group costs by month-year
  const grouped: Record<string, Cost[]> = {};
  costs.forEach((c) => {
    const key = new Date(c.date).toLocaleString("en-GB", {
      month: "long",
      year: "numeric",
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-3">
          <Receipt size={32} className="text-[#0A2463]" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A2463]">
            Miscellaneous Costs
          </h1>
        </div>
        <button
          onClick={() => openModal()}
          className="self-start sm:self-auto flex items-center gap-2 bg-[#FFC107] text-[#212529] px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow hover:bg-[#e0a800] hover:scale-105 transition font-semibold text-sm sm:text-base"
        >
          <PlusCircle size={18} /> Add New
        </button>
      </div>

      {/* Costs Table */}
      <div className="bg-white rounded-2xl shadow px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
          <Calendar className="text-[#FFC107]" /> Costs History
        </h2>

        <div className="table-scroll rounded-2xl border border-slate-100">
          <table className="w-full text-xs sm:text-sm lg:text-base">
            <thead className="bg-yellow-500 text-white">
              <tr>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm md:text-lg font-semibold uppercase">
                  Month-Year
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm md:text-lg font-semibold uppercase">
                  Name
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm md:text-lg font-semibold uppercase">
                  Date
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm md:text-lg font-semibold uppercase">
                  Amount
                </th>
                <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm md:text-lg font-semibold uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="font-semibold text-xs sm:text-sm md:text-base">
              {Object.entries(grouped).map(([month, items]) =>
                items.map((c, idx) => (
                  <tr
                    key={c._id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"
                    } hover:bg-[#FFC107]/10 transition`}
                  >
                    {idx === 0 && (
                      <td
                        className="px-3 sm:px-4 py-3 sm:py-4 text-center align-middle font-semibold text-sm sm:text-base md:text-lg"
                        rowSpan={items.length}
                      >
                        {month}
                      </td>
                    )}
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center break-words">
                      {c.name}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                      {new Date(c.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-center">
                      ₹ {c.amount}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <div className="flex justify-center gap-2 sm:gap-3">
                        <button
                          onClick={() => openModal(c)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition flex items-center gap-1 text-xs sm:text-sm"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(c._id);
                            setDeleteName(c.name);
                          }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition flex items-center gap-1 text-xs sm:text-sm"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {costs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-400 text-sm sm:text-base"
                  >
                    No costs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white px-5 sm:px-8 lg:px-10 py-6 sm:py-8 rounded-3xl max-w-md w-[90%] sm:w-full shadow-2xl border border-gray-200">
            <h3 className="text-xl sm:text-3xl font-bold text-[#0A2463] mb-4 sm:mb-6 flex items-center gap-3">
              <PlusCircle className="text-[#FFC107]" />
              {formId ? "Edit Cost" : "Add New Cost"}
            </h3>
            <div className="flex flex-col gap-4 sm:gap-6">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-lg shadow w-full"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-lg shadow w-full placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-lg shadow w-full"
              />
              <div className="flex justify-end gap-3 sm:gap-4 mt-2">
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow text-sm sm:text-base"
                >
                  {formId ? "Save Changes" : "Add Cost"}
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white px-5 sm:px-8 lg:px-10 py-6 sm:py-8 rounded-3xl max-w-md w-[90%] sm:w-full shadow-2xl border border-gray-200 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-red-600 mb-3 sm:mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 text-sm sm:text-lg mb-5 sm:mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#0A2463]">{deleteName}</span>
              ?
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={confirmDelete}
                className="bg-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-red-700 transition font-semibold shadow text-sm sm:text-base"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="bg-gray-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Feedback Modal */}
      {feedback && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
          <div
            className={`p-5 sm:p-6 rounded-2xl shadow-2xl text-center max-w-sm w-[90%] sm:w-full transition-all ${
              feedback.type === "success"
                ? "bg-green-50 text-green-700 border border-green-300"
                : "bg-red-50 text-red-700 border border-red-300"
            }`}
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              {feedback.type === "success" ? "✅ Success" : "❌ Error"}
            </h3>
            <p className="text-sm sm:text-lg">{feedback.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
