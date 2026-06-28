"use client";

import { ClipboardList, PlusCircle, Edit } from "lucide-react";
import { useEffect, useState } from "react";

type Plan = {
  _id?: string;
  name: string;
  validity: number;
  amount: number;
  validityType?: "days" | "months";
};

export default function PlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: "", validity: "", amount: "" });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [validityType, setValidityType] = useState<"months" | "days">("months");

  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  // Fetch all plans
  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setPlans([]);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Sort plans by actual total duration in days
  const sortedPlans = [...plans].sort((a, b) => {
    const aDays = a.validity * (a.validityType === "days" ? 1 : 30);
    const bDays = b.validity * (b.validityType === "days" ? 1 : 30);
    return aDays - bDays;
  });

  // Add or Update plan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const planData = {
      name: form.name.trim(),
      validity: Number(form.validity),
      amount: Number(form.amount),
      validityType,
    };

    try {
      let res;
      if (selectedId) {
        res = await fetch(`/api/plans/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planData),
        });
      } else {
        res = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planData),
        });
      }

      const data = await res.json();
      if (data.success) {
        fetchPlans();
        setForm({ name: "", validity: "", amount: "" });
        setValidityType("months");
        setSelectedId(null);
        setShowModal(false);

        setPopupMessage(
          selectedId
            ? "Plan updated successfully!"
            : "New plan added successfully!"
        );
      } else {
        console.error(data.error || "Failed to save plan");
        setPopupMessage("❌ Failed to save plan. Please try again.");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      setPopupMessage("❌ An unexpected error occurred while saving the plan.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <ClipboardList size={24} />
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316]">
            Subscription Plans
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary self-start sm:self-auto px-5 sm:px-8 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer flex items-center gap-2"
        >
          <PlusCircle size={20} /> Add Plan
        </button>
      </div>

      {/* Plan Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedPlans.map((plan) => (
          <div
            key={plan._id}
            className="glass-card p-6 rounded-2xl border-[#2A2A2A] shadow-lg hover:shadow-2xl hover:border-zinc-700/80 transition-all flex flex-col justify-between"
          >
            <div>
              <h3 className="text-2xl sm:text-3xl font-headline tracking-wider text-[#f97316] mb-3 uppercase">
                {plan.name}
              </h3>
              <div className="space-y-2 mb-6">
                <p className="text-zinc-300 text-lg flex items-center gap-2 font-medium">
                  <span className="text-zinc-500">Validity:</span>
                  <span className="text-[#e5e2e1] font-semibold">
                    {plan.validity} {plan.validityType || "Months"}
                  </span>
                </p>
                <p className="text-zinc-300 text-lg flex items-center gap-2 font-medium">
                  <span className="text-zinc-500">Price:</span>
                  <span className="text-[#22c55e] font-semibold">
                    ₹{plan.amount}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
              {plan._id && (
                <>
                  <button
                    onClick={() => {
                      setSelectedId(plan._id!);
                      setForm({
                        name: plan.name,
                        validity: plan.validity.toString(),
                        amount: plan.amount.toString(),
                      });
                      setValidityType(plan.validityType || "months");
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-[#e5e2e1] border border-zinc-700 text-sm font-headline tracking-wider uppercase cursor-pointer transition shadow"
                  >
                    <Edit size={16} /> Edit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedId(plan._id!);
                      setShowDeleteModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-650 hover:bg-red-700 text-white text-sm font-headline tracking-wider uppercase cursor-pointer transition shadow"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4 text-center border-[#2A2A2A]">
            <h2 className="text-2xl font-headline tracking-wider mb-3 text-red-500 uppercase">
              Delete Plan
            </h2>
            <p className="text-zinc-300 mb-6 text-sm sm:text-base">
              Are you sure you want to permanently delete this plan?
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={async () => {
                  if (selectedId) {
                    try {
                      const res = await fetch(`/api/plans/${selectedId}`, {
                        method: "DELETE",
                      });
                      const data = await res.json();
                      if (data.success) {
                        fetchPlans();
                        setPopupMessage("✅ Plan deleted successfully!");
                      } else {
                        setPopupMessage("❌ Failed to delete plan.");
                      }
                    } catch {
                      setPopupMessage("❌ Server error while deleting plan.");
                    }
                    setShowDeleteModal(false);
                    setSelectedId(null);
                  }
                }}
                className="bg-red-650 text-white px-5 sm:px-6 py-2.5 rounded-xl hover:bg-red-700 transition font-headline text-xl tracking-wider shadow cursor-pointer"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedId(null);
                }}
                className="btn-secondary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card text-[#e5e2e1] p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 relative border-[#2A2A2A]">
            <button
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl cursor-pointer"
              onClick={() => {
                setShowModal(false);
                setSelectedId(null);
                setForm({ name: "", validity: "", amount: "" });
                setValidityType("months");
              }}
            >
              &times;
            </button>

            <h2 className="text-2xl sm:text-3xl font-headline tracking-wider text-[#f97316] mb-6 uppercase">
              {selectedId ? "Edit Plan" : "Add New Plan"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                    Plan Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                    placeholder="Enter plan name"
                  />
                </div>

                {/* Validity + dropdown */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                      Validity
                    </label>
                    <input
                      name="validity"
                      type="number"
                      required
                      value={form.validity}
                      onChange={handleChange}
                      className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                      placeholder={`Enter ${validityType}`}
                    />
                  </div>
                  <div className="sm:w-40">
                    <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                      Type
                    </label>
                    <select
                      value={validityType}
                      onChange={(e) =>
                        setValidityType(e.target.value as "months" | "days")
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border-[#2A2A2A] text-sm sm:text-base text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer"
                    >
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                    Amount (₹)
                  </label>
                  <input
                    name="amount"
                    type="number"
                    required
                    value={form.amount}
                    onChange={handleChange}
                    className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                    placeholder="Enter amount"
                  />
                </div>

                <div className="flex justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <button
                    type="submit"
                    className="btn-primary px-6 sm:px-8 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
                  >
                    Save Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedId(null);
                      setForm({ name: "", validity: "", amount: "" });
                      setValidityType("months");
                    }}
                    className="btn-secondary px-6 sm:px-8 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {popupMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/60">
          <div className="glass-card px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl text-center max-w-sm w-full mx-4 border-[#2A2A2A] text-[#e5e2e1]">
            <p className="text-lg sm:text-xl font-headline tracking-wider mb-4">
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
