"use client";

import { useEffect, useState } from "react";
import { Trash2, Edit, PlusCircle, Archive } from "lucide-react";

type InventoryItem = {
  _id?: string;
  name: string;
  category: string;
  manufacturer: string;
  quantity: number;
  price: number;
  status: "Active" | "Inactive";
};

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // ✅ Popup state
  const [showFeedbackModal, setShowFeedbackModal] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [form, setForm] = useState<InventoryItem>({
    name: "",
    category: "",
    manufacturer: "",
    quantity: 0,
    price: 0,
    status: "Active",
  });

  // Auto close popup
  useEffect(() => {
    if (showFeedbackModal) {
      const timer = setTimeout(() => setShowFeedbackModal(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [showFeedbackModal]);

  // Fetch inventory
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        setInventory(data.items || []);
      } catch (err) {
        console.error(err);
        setShowFeedbackModal({
          type: "error",
          message: "Failed to load inventory.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  // Open form for editing
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({ ...item, manufacturer: item.manufacturer || "" });
    setShowForm(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingItem ? "PUT" : "POST";
      const endpoint = editingItem
        ? `/api/inventory/${editingItem._id}`
        : "/api/inventory";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save item");
      const savedItem = await res.json();

      if (editingItem) {
        setInventory((prev) =>
          prev.map((i) => (i._id === savedItem.item._id ? savedItem.item : i))
        );
        setShowFeedbackModal({
          type: "success",
          message: "Equipment updated successfully! ✅",
        });
      } else {
        setInventory((prev) => [savedItem.item, ...prev]);
        setShowFeedbackModal({
          type: "success",
          message: "New equipment added successfully! ✅",
        });
      }

      setForm({
        name: "",
        category: "",
        manufacturer: "",
        quantity: 0,
        price: 0,
        status: "Active",
      });
      setEditingItem(null);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setShowFeedbackModal({
        type: "error",
        message: "Failed to save equipment. ❌",
      });
    }
  };

  // Delete handler with confirmation modal
  const handleDelete = async (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInventory((prev) => prev.filter((i) => i._id !== id));
        setShowFeedbackModal({
          type: "success",
          message: "Equipment deleted successfully! 🗑️",
        });
      } else {
        setShowFeedbackModal({
          type: "error",
          message: "Failed to delete equipment. ❌",
        });
      }
    } catch (err) {
      console.error(err);
      setShowFeedbackModal({
        type: "error",
        message: "Error deleting equipment. ❌",
      });
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const filteredInventory = inventory.filter((i) =>
    i.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = inventory.length;
  const activeItems = inventory.filter((i) => i.status === "Active").length;
  const totalValue = inventory.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-[#E9ECEF] px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#0A2463] text-[#FFC107] shadow-md">
            <Archive size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A2463] leading-tight">
              Inventory
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Track all gym equipment, stock, and status at one place.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 lg:w-72">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl border border-gray-300 shadow-sm
                text-sm sm:text-base text-gray-700 placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition-all duration-300 hover:shadow-md bg-gray-50"
            />
          </div>

          {/* Add New Equipment Button */}
          <button
            onClick={() => {
              setShowForm(true);
              setEditingItem(null);
            }}
            className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2 bg-[#FFC107] text-[#0A2463] rounded-2xl shadow-md hover:bg-[#e0ac00] transition font-semibold text-sm sm:text-base"
          >
            <PlusCircle size={20} />Add New
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3 flex flex-col">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Items
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-[#0A2463]">
            {totalItems}
          </span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3 flex flex-col">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Active Items
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-emerald-600">
            {activeItems}
          </span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-3 flex flex-col">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Total Value
          </span>
          <span className="mt-1 text-xl sm:text-2xl font-bold text-indigo-600">
            ₹{totalValue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="table-scroll rounded-2xl border border-slate-100">
        <table className="w-full text-xs sm:text-sm lg:text-base">
          <thead className="bg-[#FFC107] text-white">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-xs sm:text-sm lg:text-base">
                Name
              </th>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-xs sm:text-sm lg:text-base">
                Category
              </th>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-xs sm:text-sm lg:text-base">
                Manufacturer
              </th>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-xs sm:text-sm lg:text-base">
                Quantity
              </th>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-xs sm:text-sm lg:text-base">
                Price (₹)
              </th>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-xs sm:text-sm lg:text-base">
                Total (₹)
              </th>
              <th className="px-4 sm:px-6 py-3 text-left font-semibold text-xs sm:text-sm lg:text-base">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3 text-center font-semibold text-xs sm:text-sm lg:text-base">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y divide-gray-200 text-sm sm:text-base lg:text-lg">
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-6 text-gray-400 text-sm sm:text-base"
                >
                  Loading inventory...
                </td>
              </tr>
            )}
            {!loading && inventory.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-6 text-gray-400 text-sm sm:text-base"
                >
                  No equipment added yet.
                </td>
              </tr>
            )}
            {filteredInventory.map((item, index) => (
              <tr
                key={item._id}
                className={`transition-transform hover:scale-[1.01] hover:shadow-sm ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-[#212529] break-words">
                  {item.name}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 break-words">
                  {item.category}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 break-words">
                  {item.manufacturer}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">{item.quantity}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  ₹{item.price.toLocaleString("en-IN")}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <span
                    className={`px-3 py-1 rounded-full font-semibold text-xs sm:text-sm ${
                      item.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md mx-3 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {editingItem ? "Edit Equipment" : "Add New Equipment"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition text-xl"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
              {[
                ["Name", "name"],
                ["Category", "category"],
                ["Manufacturer", "manufacturer"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="block text-gray-700 font-medium mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={form[key as keyof InventoryItem] as string}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-sm sm:text-base"
                  />
                </div>
              ))}
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as any })
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition text-sm sm:text-base"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-[#FFC107] text-[#0A2463] px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:bg-[#e0ac00] transition font-semibold shadow-md text-sm sm:text-base"
                >
                  {editingItem ? "Save Changes" : "Add Equipment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="bg-gray-500 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow-md text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full mx-3 shadow-2xl border border-gray-200 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-red-600 mb-3 sm:mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 mb-5 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to delete this equipment?
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="bg-red-600 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:bg-red-700 transition font-semibold shadow text-sm sm:text-base"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-gray-500 text-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Feedback Popup */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40">
          <div
            className={`p-5 sm:p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 transition-all
          ${
            showFeedbackModal.type === "success"
              ? "bg-green-50 text-green-700 border border-green-300"
              : "bg-red-50 text-red-700 border border-red-300"
          }`}
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              {showFeedbackModal.type === "success" ? "✅ Success" : "❌ Error"}
            </h3>
            <p className="text-sm sm:text-lg">{showFeedbackModal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
