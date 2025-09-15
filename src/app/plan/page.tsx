"use client";

import { ClipboardList } from "lucide-react";
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
    const res = await fetch("/api/plans");
    const data = await res.json();
    setPlans(data);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.validity || !form.amount) {
      alert("Please fill all fields");
      return;
    }

    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        validity: Number(form.validity),
        amount: Number(form.amount),
      }),
    });

    const result = await res.json();
    if (result.success) {
      fetchPlans();
      setForm({ name: "", validity: "", amount: "" });
    }
  };

  // Before rendering Plan Cards
  const sortedPlans = [...plans].sort((a, b) => a.validity - b.validity); // ascending validity

  // const handleDelete = async (id?: string) => {
  //   if (!id) return;

  //   const res = await fetch(`/api/plans/${id}`, {
  //     method: "DELETE",
  //   });

  //   const result = await res.json();
  //   if (result.success) {
  //     fetchPlans(); // refresh UI
  //   } else {
  //     console.error("Delete failed:", result.message);
  //   }
  // };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList size={36} className="text-yellow-500" />
        <h1 className="text-[42px] font-bold text-yellow-500">View Plans</h1>
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
              <p className="text-gray-800 text-2xl">⏱ {plan.validity} months</p>
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

      {/* Add Plan Button */}
      <div className="flex justify-start mb-6 mt-6 ml-5">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-yellow-400 text-[#15145a] px-12 py-4 text-xl rounded-full font-bold shadow"
        >
          + Add Plan
        </button>
      </div>

      {/* Popup Form */}
      {showAddModal && !selectedId && (
        <div className="fixed inset-0 backdrop-brightness-100 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white text-[#15145a] p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            <button
              className="absolute top-3 right-4 text-gray-500 text-xl hover:text-red-600"
              onClick={() => setShowAddModal(false)}
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold mb-4">Add New Plan</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                // Reset previous errors
                const newErrors: Record<string, string> = {};

                if (!form.name.trim()) newErrors.name = "Plan Name is required";
                if (!form.validity.trim())
                  newErrors.validity = "Validity is required";
                if (!form.amount.trim())
                  newErrors.amount = "Amount is required";

                setErrors(newErrors);

                // Stop submission if any error
                if (Object.keys(newErrors).length > 0) return;

                // Submit to API only if valid
                const res = await fetch("/api/plans", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: form.name,
                    validity: Number(form.validity),
                    amount: Number(form.amount),
                  }),
                });

                const result = await res.json();
                if (result.success) {
                  fetchPlans(); // Refresh plans
                  setForm({ name: "", validity: "", amount: "" });
                  setShowAddModal(false);
                } else {
                  console.error(result.message || "Failed to add plan");
                }
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-bold">Plan Name</label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded text-black bg-gray-100 ${
                      errors.name ? "border border-red-500" : ""
                    }`}
                    placeholder="Enter plan name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-bold">
                    Validity (months)
                  </label>
                  <input
                    name="validity"
                    type="number"
                    value={form.validity}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded text-black bg-gray-100 ${
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
                  <label className="block mb-1 font-bold">Amount</label>
                  <input
                    name="amount"
                    type="number"
                    value={form.amount}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded text-black bg-gray-100 ${
                      errors.amount ? "border border-red-500" : ""
                    }`}
                    placeholder="Enter amount"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <button
                    type="submit"
                    className="bg-yellow-400 text-[#15145a] px-6 py-2 rounded font-bold shadow hover:bg-yellow-500 transition"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-gray-200 text-[#15145a] px-6 py-2 rounded font-bold hover:bg-gray-300 transition"
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
