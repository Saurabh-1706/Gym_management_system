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
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body text-left">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <Receipt size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] uppercase">
            Miscellaneous Costs
          </h1>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase whitespace-nowrap"
        >
          <PlusCircle size={18} /> Add New
        </button>
      </div>

      {/* Costs Table */}
      <div className="glass-card rounded-2xl border border-zinc-800 p-4 sm:p-6 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-6 flex items-center gap-2 uppercase">
          <Calendar className="text-[#f97316]" size={20} /> Costs History
        </h2>

        <div className="w-full overflow-x-auto">
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-[#0A0A0A]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[#e0c0b1] font-headline text-base tracking-wider uppercase">
                  <th className="px-5 py-3.5 text-center">Month-Year</th>
                  <th className="px-5 py-3.5 text-center">Name</th>
                  <th className="px-5 py-3.5 text-center">Date</th>
                  <th className="px-5 py-3.5 text-center">Amount</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {Object.entries(grouped).map(([month, items]) =>
                  items.map((c, idx) => (
                    <tr
                      key={c._id}
                      className="hover:bg-white/5 transition"
                    >
                      {idx === 0 && (
                        <td
                          className="px-5 py-3.5 text-center align-middle font-headline text-[#e0c0b1] text-base border-r border-zinc-900 bg-[#050505]"
                          rowSpan={items.length}
                        >
                          {month}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-center font-semibold text-[#e5e2e1] break-words">
                        {c.name}
                      </td>
                      <td className="px-5 py-3.5 text-center text-zinc-400">
                        {new Date(c.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-5 py-3.5 text-center font-semibold text-[#f97316]">
                        ₹ {c.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-center gap-2 sm:gap-3">
                          <button
                            onClick={() => openModal(c)}
                            className="btn-secondary px-3 py-1.5 rounded-xl font-headline text-xs tracking-wider text-white shadow cursor-pointer uppercase flex items-center gap-1"
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setDeleteId(c._id);
                              setDeleteName(c.name);
                            }}
                            className="bg-red-950/40 text-red-400 border border-red-500/25 px-3 py-1.5 rounded-xl hover:bg-red-900/20 hover:text-red-300 transition text-xs font-headline tracking-wider cursor-pointer uppercase flex items-center gap-1"
                          >
                            <Trash2 size={14} /> Delete
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
                      className="text-center py-8 text-zinc-500 text-sm sm:text-base font-medium uppercase tracking-wider"
                    >
                      No costs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-[90%] sm:w-full border border-zinc-800 text-left">
            <h3 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-5 flex items-center gap-3 uppercase">
              <PlusCircle className="text-[#f97316]" size={22} />
              {formId ? "Edit Cost" : "Add New Cost"}
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Cost Name
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Cost Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base text-[#e5e2e1]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Cost Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base"
                />
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 mt-6">
                <button
                  onClick={handleSubmit}
                  className="btn-primary px-5 sm:px-6 py-2.5 rounded-xl font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  {formId ? "Save Changes" : "Add Cost"}
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-[90%] sm:w-full border border-zinc-800 text-center text-[#e5e2e1]">
            <h3 className="text-xl sm:text-2xl font-headline tracking-wider text-red-500 mb-3 uppercase">
              Confirm Deletion
            </h3>
            <p className="text-zinc-300 mb-6 text-sm sm:text-base">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#f97316]">{deleteName}</span>?
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={confirmDelete}
                className="btn-primary px-5 sm:px-6 py-2.5 rounded-xl font-headline text-lg tracking-wider text-white shadow cursor-pointer uppercase"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="btn-secondary px-5 sm:px-6 py-2.5 rounded-xl font-headline text-lg tracking-wider text-white shadow cursor-pointer uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
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
