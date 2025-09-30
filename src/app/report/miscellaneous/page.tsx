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

  // Fetch costs
  const fetchCosts = async () => {
    const res = await fetch("/api/miscellaneous");
    const data = await res.json();
    if (data.success) setCosts(data.costs);
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
    if (!name || !date || !amount) return alert("Please fill all fields");

    const method = formId ? "PUT" : "POST";
    const url = formId ? `/api/miscellaneous/${formId}` : "/api/miscellaneous";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date, amount: Number(amount) }),
    });
    const data = await res.json();
    if (data.success) {
      setModalOpen(false);
      fetchCosts();
    } else {
      alert(data.message || "Failed to save cost");
    }
  };

  // Group costs by month-year and sort months descending
  const grouped: Record<string, Cost[]> = {};

  // First, sort costs by date descending
  const sortedCosts = [...costs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedCosts.forEach((c) => {
    const key = new Date(c.date).toLocaleString("en-GB", {
      month: "long",
      year: "numeric",
    });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  return (
    <div className="p-6 bg-[#F5F7FA] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <Receipt size={40} className="text-[#0A2463]" />
          <h1 className="text-4xl font-bold text-[#0A2463]">
            Miscellaneous Costs
          </h1>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-[#FFC107] text-[#212529] px-6 py-3 rounded-xl shadow hover:bg-[#e0a800] hover:scale-105 transition font-semibold"
        >
          <PlusCircle /> Add New
        </button>
      </div>

      {/* Costs Table */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="text-[#FFC107]" /> Costs History
        </h2>
        <table className="min-w-full divide-y divide-gray-300 rounded-2xl overflow-hidden">
          <thead className="bg-yellow-500 text-white">
            <tr>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Month-Year
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Name
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Date
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Amount
              </th>
              <th className="px-6 py-4 text-center text-lg font-semibold uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="font-semibold">
            {Object.entries(grouped).map(([month, items]) =>
              items.map((c, idx) => (
                <tr
                  key={c._id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"
                  } hover:bg-[#FFC107]/20`}
                >
                  {idx === 0 && (
                    <td
                      className="px-6 py-4 text-xl font-semibold text-center"
                      rowSpan={items.length}
                    >
                      {month}
                    </td>
                  )}
                  <td className="px-6 py-4 text-xl text-center">{c.name}</td>
                  <td className="px-6 py-4 text-xl text-center">
                    {new Date(c.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-xl text-center">
                    ₹ {c.amount}
                  </td>
                  <td className="px-6 py-4 text-center flex justify-center gap-2">
                    <button
                      onClick={() => openModal(c)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition flex items-center gap-1"
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Delete this cost?")) return;
                        const res = await fetch(`/api/miscellaneous/${c._id}`, {
                          method: "DELETE",
                        });
                        const data = await res.json();
                        if (data.success) fetchCosts();
                        else alert("Failed to delete");
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {costs.length === 0 && (
          <p className="text-gray-500 mt-4 text-center">
            No costs recorded yet.
          </p>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-15 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-4xl font-bold text-[#0A2463] mb-6 flex items-center gap-3">
              <PlusCircle className="text-[#FFC107]" />{" "}
              {formId ? "Edit Cost" : "Add New Cost"}
            </h3>
            <div className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-xl px-5 py-4 text-xl shadow w-full"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded-xl px-5 py-4 text-xl shadow w-full placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border rounded-xl px-5 py-4 text-xl shadow w-full"
              />
              <div className="flex justify-end gap-4 mt-2">
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow"
                >
                  {formId ? "Save Changes" : "Add Cost"}
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
