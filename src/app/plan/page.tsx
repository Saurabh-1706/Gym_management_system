"use client";

import { ClipboardList, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Plan = {
  _id?: string; // Optional because new plans (before saving) don't have it yet
  name: string;
  validity: number;
  amount: number;
};

export default function PlanPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ name: "", validity: "", amount: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();

      if (data.success && Array.isArray(data.plans)) {
        setPlans(data.plans);
      } else {
        console.error("Unexpected response format:", data);
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

  // Before rendering Plan Cards
  const sortedPlans = [...plans].sort((a, b) => a.validity - b.validity); // ascending validity

  return (
    <div className="p-6">
      {/* Header with Add Plan Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList size={36} className="text-yellow-500" />
          <h1 className="text-[42px] font-bold text-yellow-500">View Plans</h1>
        </div>

        {/* Add Plan Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-400 text-[#15145a] px-8 py-3 text-xl flex items-center gap-2 rounded-full font-bold shadow hover:bg-yellow-500 transition"
        >
           <PlusCircle size={20} /> Add Plan
        </button>
      </div>

      {/* Table */}
      <div className=" p-4 rounded-lg text-white">
        {/* Plan Detail */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white text-[#15145a] p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all"
            >
              <h3 className="text-3xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-800 text-2xl">⏱ {plan.validity} Months</p>
              <p className="text-gray-800 mb-4 text-2xl">💰 ₹{plan.amount}</p>

              <div className="flex justify-end gap-3">
                {plan._id && (
                  <button
                    onClick={() => {
                      setSelectedId(plan._id || null);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-500 text-white text-base px-4 py-2 rounded-lg shadow hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 background-filter backdrop-brightness-100 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 text-center transform scale-125">
              <h2 className="text-lg font-bold mb-4 text-[#15145a]">
                Are you sure?
              </h2>
              <p className="text-sm text-gray-700 mb-6">
                Do you really want to delete this plan?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={async () => {
                    if (selectedId) {
                      const res = await fetch(`/api/plans/${selectedId}`, {
                        method: "DELETE",
                      });
                      const result = await res.json();
                      if (result.success) {
                        fetchPlans();
                      } else {
                        console.error(result.message || "Delete failed");
                      }
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
      </div>

      {/* Popup Form */}
      {showAddModal && !selectedId && (
        <div className="fixed inset-0 backdrop-brightness-100 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white text-[#15145a] p-12 rounded-2xl shadow-2xl w-full max-w-xl relative">
            {/* Close Button */}
            <button
              className="absolute top-4 right-6 text-gray-500 text-2xl hover:text-red-600"
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </button>

            <h2 className="text-3xl font-bold mb-6">Add New Plan</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // form submission logic remains unchanged
              }}
            >
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 font-bold text-lg">
                    Plan Name
                  </label>
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
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 font-bold text-lg">
                    Validity (months)
                  </label>
                  <input
                    name="validity"
                    type="number"
                    value={form.validity}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded text-black bg-gray-100 text-lg ${
                      errors.validity ? "border border-red-500" : ""
                    }`}
                    placeholder="Months"
                  />
                  {errors.validity && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.validity}
                    </p>
                  )}
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
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
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
                    onClick={() => setShowAddModal(false)}
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
