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
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <Archive size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] leading-tight uppercase">
              Inventory
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Track all gym equipment, stock, and status at one place.
            </p>
          </div>
        </div>

        <div className="flex sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64 lg:w-72">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark w-full pl-10 pr-4 py-2.5 rounded-lg text-sm sm:text-base"
            />
          </div>

          {/* Add New Equipment Button */}
          <button
            onClick={() => {
              setShowForm(true);
              setEditingItem(null);
            }}
            className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase whitespace-nowrap"
          >
            <PlusCircle size={18} /> Add New
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="glass-card border-[#2A2A2A] px-5 py-4 flex flex-col shadow-lg text-left">
          <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
            Total Items
          </span>
          <span className="mt-1 text-2xl font-headline tracking-wider text-[#f97316]">
            {totalItems}
          </span>
        </div>
        <div className="glass-card border-[#2A2A2A] px-5 py-4 flex flex-col shadow-lg text-left">
          <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
            Active Items
          </span>
          <span className="mt-1 text-2xl font-headline tracking-wider text-[#22c55e]">
            {activeItems}
          </span>
        </div>
        <div className="glass-card border-[#2A2A2A] px-5 py-4 flex flex-col shadow-lg text-left">
          <span className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
            Total Value
          </span>
          <span className="mt-1 text-2xl font-headline tracking-wider text-blue-400">
            ₹{totalValue.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="w-full overflow-x-auto">
        <div className="rounded-xl border-[#2A2A2A] overflow-hidden bg-[#0A0A0A]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="table-thead">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Manufacturer</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Price (₹)</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total (₹)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {loading && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-zinc-500 text-sm sm:text-base font-medium"
                  >
                    Loading inventory...
                  </td>
                </tr>
              )}
              {!loading && inventory.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-8 text-zinc-500 text-sm sm:text-base font-medium"
                  >
                    No equipment added yet.
                  </td>
                </tr>
              )}
              {filteredInventory.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-white/5 transition"
                >
                  <td className="px-5 py-3.5 font-semibold text-[#e5e2e1] break-words">
                    {item.name}
                  </td>
                  <td className="px-5 py-3.5 break-words text-zinc-400">
                    {item.category}
                  </td>
                  <td className="px-5 py-3.5 break-words text-zinc-400">
                    {item.manufacturer}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">{item.quantity}</td>
                  <td className="px-5 py-3.5 text-zinc-400">
                    ₹{item.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-[#f97316]">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "Active"
                          ? "bg-green-950/20 text-[#22c55e] border border-[#22c55e]/25"
                          : "bg-red-950/20 text-red-400 border border-red-500/25"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-400 hover:text-blue-300 transition cursor-pointer"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id!)}
                        className="text-red-450 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl border-[#2A2A2A] text-left">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] uppercase">
                {editingItem ? "Edit Equipment" : "Add New Equipment"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-zinc-500 hover:text-white transition text-2xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {[
                ["Name", "name"],
                ["Category", "category"],
                ["Manufacturer", "manufacturer"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={form[key as keyof InventoryItem] as string}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    required
                    className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  required
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  required
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as any })
                  }
                  required
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base cursor-pointer text-[#e5e2e1]"
                >
                  <option value="Active" className="bg-[#121212]">Active</option>
                  <option value="Inactive" className="bg-[#121212]">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 mt-6">
                <button
                  type="submit"
                  className="btn-primary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  {editingItem ? "Save Changes" : "Add Equipment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="btn-secondary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl border-[#2A2A2A] text-center text-[#e5e2e1]">
            <h3 className="text-xl sm:text-2xl font-headline tracking-wider text-red-500 mb-3 uppercase">
              Confirm Deletion
            </h3>
            <p className="text-zinc-300 mb-6 text-sm sm:text-base">
              Are you sure you want to delete this equipment?
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="btn-primary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer uppercase"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Popup */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-3">
          <div
            className={`p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full border transition-all ${
              showFeedbackModal.type === "success"
                ? "bg-green-950/20 text-[#22c55e] border-[#22c55e]/25 backdrop-blur-md"
                : "bg-red-950/20 text-red-400 border border-red-500/25 backdrop-blur-md"
            }`}
          >
            <h3 className="text-2xl font-headline tracking-wider mb-2">
              {showFeedbackModal.type === "success" ? "✅ Success" : "❌ Error"}
            </h3>
            <p className="text-sm sm:text-lg font-medium">{showFeedbackModal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
