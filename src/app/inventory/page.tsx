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

  const [form, setForm] = useState<InventoryItem>({
    name: "",
    category: "",
    manufacturer: "",
    quantity: 0,
    price: 0,
    status: "Active",
  });

  // Fetch inventory
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        setInventory(data.items || []);
      } catch (err) {
        console.error(err);
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
      } else {
        setInventory((prev) => [savedItem.item, ...prev]);
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
      alert("Failed to save item");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) setInventory((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInventory = inventory.filter((i) =>
    i.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-10 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Archive size={32} className="text-blue-600" /> Inventory
        </h1>

        <div className="flex flex-col sm:flex-row items-end gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xl">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search Equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 shadow-md
           text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2
           focus:ring-blue-500 focus:border-blue-500 transition-all duration-300
           hover:shadow-lg"
            />
          </div>

          {/* Add New Equipment Button */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600 transition font-semibold"
          >
            <PlusCircle size={20} /> Add New Equipment
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-yellow-500 text-white uppercase text-xl">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Category</th>
              <th className="px-6 py-3 text-left font-semibold">
                Manufacturer
              </th>
              <th className="px-6 py-3 text-left font-semibold">Quantity</th>
              <th className="px-6 py-3 text-left font-semibold">Price (₹)</th>
              <th className="px-6 py-3 text-left font-semibold">Total (₹)</th>
              <th className="px-6 py-3 text-left font-semibold">Status</th>
              <th className="px-6 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y divide-gray-200 text-xl">
            {inventory.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-400">
                  No equipment added yet.
                </td>
              </tr>
            )}
            {inventory.map((item, index) => (
              <tr
                key={item._id}
                className={`transition-transform transform hover:scale-[1.01] hover:shadow-md ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-6 py-4 font-medium">{item.name}</td>
                <td className="px-6 py-4">{item.category}</td>
                <td className="px-6 py-4">{item.manufacturer}</td>
                <td className="px-6 py-4">{item.quantity}</td>
                <td className="px-6 py-4">₹{item.price}</td>
                <td className="px-6 py-4 font-semibold">
                  ₹{item.price * item.quantity}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full font-semibold text-sm ${
                      item.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-3">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id!)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingItem ? "Edit Equipment" : "Add New Equipment"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={form.manufacturer}
                  onChange={(e) =>
                    setForm({ ...form, manufacturer: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Price (₹)
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as any })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-6 py-3 rounded-xl hover:bg-yellow-600 transition font-semibold shadow-md"
                >
                  {editingItem ? "Save Changes" : "Add Equipment"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
