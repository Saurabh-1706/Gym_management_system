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
    <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList size={32} className="text-yellow-500" />
          <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold text-yellow-500">
            View Plans
          </h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto bg-yellow-400 text-[#15145a] px-5 sm:px-8 py-2.5 sm:py-3 text-base sm:text-xl flex items-center gap-2 rounded-full font-bold shadow hover:bg-yellow-500 transition"
        >
          <PlusCircle size={20} /> Add Plan
        </button>
      </div>

      {/* Plan Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {sortedPlans.map((plan) => (
          <div
            key={plan._id}
            className="bg-white text-[#15145a] p-5 sm:p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all"
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">{plan.name}</h3>
            <p className="text-gray-800 text-xl sm:text-2xl">
              ⏱ {plan.validity} {plan.validityType || "Months"}
            </p>
            <p className="text-gray-800 mb-4 text-xl sm:text-2xl">
              💰 ₹{plan.amount}
            </p>

            <div className="flex justify-end gap-3">
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
                    className="bg-yellow-500 text-white text-sm sm:text-base px-4 py-2 rounded-lg shadow hover:bg-yellow-600 transition flex items-center gap-1"
                  >
                    <Edit size={16} /> Edit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedId(plan._id!);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-500 text-white text-sm sm:text-base px-4 py-2 rounded-lg shadow hover:bg-red-600 transition"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm mx-4 text-center">
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-[#15145a]">
              Are you sure?
            </h2>
            <p className="text-sm text-gray-700 mb-5">
              Do you really want to delete this plan?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
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
                className="bg-red-500 text-white px-4 py-2 rounded text-sm sm:text-base"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedId(null);
                }}
                className="bg-gray-300 text-black px-4 py-2 rounded text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white text-[#15145a] p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl w-full max-w-lg mx-4 relative">
            <button
              className="absolute top-3 right-4 text-gray-500 text-2xl hover:text-red-600"
              onClick={() => {
                setShowModal(false);
                setSelectedId(null);
                setForm({ name: "", validity: "", amount: "" });
                setValidityType("months");
              }}
            >
              &times;
            </button>

            <h2 className="text-2xl sm:text-3xl font-bold mb-5">
              {selectedId ? "Edit Plan" : "Add New Plan"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5 sm:space-y-6">
                <div>
                  <label className="block mb-2 font-bold text-base sm:text-lg">
                    Plan Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 sm:py-3 rounded text-black bg-gray-100 text-base sm:text-lg"
                    placeholder="Enter plan name"
                  />
                </div>

                {/* Validity + dropdown – stacked on mobile */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
                  <div className="flex-1">
                    <label className="block mb-2 font-bold text-base sm:text-lg">
                      Validity
                    </label>
                    <input
                      name="validity"
                      type="number"
                      value={form.validity}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 sm:py-3 rounded text-black bg-gray-100 text-base sm:text-lg"
                      placeholder={`Enter ${validityType}`}
                    />
                  </div>
                  <div className="sm:w-40">
                    <label className="block mb-2 font-bold text-base sm:text-lg">
                      Type
                    </label>
                    <select
                      value={validityType}
                      onChange={(e) =>
                        setValidityType(e.target.value as "months" | "days")
                      }
                      className="w-full px-4 py-2.5 sm:py-3 rounded text-black bg-gray-100 text-base sm:text-lg"
                    >
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-base sm:text-lg">
                    Amount
                  </label>
                  <input
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 sm:py-3 rounded text-black bg-gray-100 text-base sm:text-lg"
                    placeholder="Enter amount"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-end mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-yellow-400 text-[#15145a] px-6 sm:px-8 py-2.5 sm:py-3 rounded font-bold shadow text-base sm:text-lg hover:bg-yellow-500 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedId(null);
                      setForm({ name: "", validity: "", amount: "" });
                      setValidityType("months");
                    }}
                    className="w-full sm:w-auto bg-gray-200 text-[#15145a] px-6 sm:px-8 py-2.5 sm:py-3 rounded font-bold text-base sm:text-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Modal (Success/Error Messages) */}
      {popupMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/40">
          <div className="bg-white px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl text-center max-w-sm w-full mx-4">
            <p className="text-base sm:text-xl font-semibold text-[#15145a]">
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
