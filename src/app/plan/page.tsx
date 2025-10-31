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

  // Sort plans by validity
  const sortedPlans = [...plans].sort((a, b) => a.validity - b.validity);

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
        // Edit plan
        res = await fetch(`/api/plans/${selectedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planData),
        });
      } else {
        // Add plan
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
      } else {
        console.error(data.error || "Failed to save plan");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList size={36} className="text-yellow-500" />
          <h1 className="text-[42px] font-bold text-yellow-500">View Plans</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-yellow-400 text-[#15145a] px-8 py-3 text-xl flex items-center gap-2 rounded-full font-bold shadow hover:bg-yellow-500 transition"
        >
          <PlusCircle size={20} /> Add Plan
        </button>
      </div>

      {/* Plan Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => (
          <div
            key={plan._id}
            className="bg-white text-[#15145a] p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all"
          >
            <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
            <p className="text-gray-800 text-2xl">
              ⏱ {plan.validity} {plan.validityType || "Months"}
            </p>
            <p className="text-gray-800 mb-4 text-2xl">💰 ₹{plan.amount}</p>

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
                    className="bg-yellow-500 text-white text-base px-4 py-2 rounded-lg shadow hover:bg-yellow-600 transition flex items-center gap-1"
                  >
                    <Edit size={16} /> Edit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedId(plan._id!);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-500 text-white text-base px-4 py-2 rounded-lg shadow hover:bg-red-600 transition"
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
        <div className="fixed inset-0 backdrop-brightness-100 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 text-center transform scale-125">
            <h2 className="text-lg font-bold mb-4 text-[#15145a]">Are you sure?</h2>
            <p className="text-sm text-gray-700 mb-6">Do you really want to delete this plan?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={async () => {
                  if (selectedId) {
                    const res = await fetch(`/api/plans/${selectedId}`, { method: "DELETE" });
                    const data = await res.json();
                    if (data.success) fetchPlans();
                    setShowDeleteModal(false);
                    setSelectedId(null);
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedId(null);
                }}
                className="bg-gray-300 text-black px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-brightness-100 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white text-[#15145a] p-12 rounded-2xl shadow-2xl w-full max-w-xl relative">
            <button
              className="absolute top-4 right-6 text-gray-500 text-2xl hover:text-red-600"
              onClick={() => {
                setShowModal(false);
                setSelectedId(null);
                setForm({ name: "", validity: "", amount: "" });
                setValidityType("months");
              }}
            >
              &times;
            </button>

            <h2 className="text-3xl font-bold mb-6">{selectedId ? "Edit Plan" : "Add New Plan"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 font-bold text-lg">Plan Name</label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded text-black bg-gray-100 text-lg ${
                      errors.name ? "border border-red-500" : ""
                    }`}
                    placeholder="Enter plan name"
                  />
                </div>

                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block mb-2 font-bold text-lg">Validity</label>
                    <input
                      name="validity"
                      type="number"
                      value={form.validity}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded text-black bg-gray-100 text-lg ${
                        errors.validity ? "border border-red-500" : ""
                      }`}
                      placeholder={`Enter ${validityType}`}
                    />
                  </div>
                  <div>
                    <label className="block mb-2 font-bold text-lg">&nbsp;</label>
                    <select
                      value={validityType}
                      onChange={(e) => setValidityType(e.target.value as "months" | "days")}
                      className="px-4 py-3 rounded text-black bg-gray-100 text-lg"
                    >
                      <option value="months">Months</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-bold text-lg">Amount</label>
                  <input
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded text-black bg-gray-100 text-lg ${
                      errors.amount ? "border border-red-500" : ""
                    }`}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="flex gap-6 justify-end mt-8">
                  <button
                    type="submit"
                    className="bg-yellow-400 text-[#15145a] px-8 py-3 rounded font-bold shadow text-lg hover:bg-yellow-500 transition"
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
                    className="bg-gray-200 text-[#15145a] px-8 py-3 rounded font-bold text-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
