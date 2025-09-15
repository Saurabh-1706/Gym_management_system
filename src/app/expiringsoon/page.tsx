"use client";

import { useEffect, useState } from "react";
import {
  User,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Trash2,
  Edit,
  Clock,
} from "lucide-react";

type Member = {
  _id: string;
  name: string;
  date: string;
  plan: string;
  mobile: string;
  email?: string;
  price?: string;
};

export default function ExpiringSoonPage() {
  const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    plan: "",
    date: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const today = new Date();

  // Fetch members whose membership is expiring within next 7 days
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("Failed to fetch members");
        const data: Member[] = await res.json();

        const soon = data.filter((m) => {
          const expiry = calculateExpiryDateObj(m.date, m.plan);
          return (
            expiry >= today &&
            expiry <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          );
        });

        setExpiringMembers(soon);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMembers();
  }, []);

  const calculateExpiryDateObj = (joinDate: string, plan: string) => {
    const date = new Date(joinDate);
    switch (plan.toLowerCase()) {
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      case "half yearly":
        date.setMonth(date.getMonth() + 6);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date;
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;

    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setExpiringMembers((prev) => prev.filter((m) => m._id !== id));
      setSelectedMember(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete member");
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    if (!selectedMember) return;

    try {
      const res = await fetch(`/api/members/${selectedMember._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Edit failed");

      setExpiringMembers((prev) =>
        prev.map((m) => (m._id === selectedMember._id ? { ...m, ...form } : m))
      );

      setShowEditModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update member");
    }
  };

  const openEditModal = (member: Member) => {
    setForm({
      name: member.name,
      mobile: member.mobile,
      email: member.email || "",
      plan: member.plan,
      date: member.date,
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-yellow-500 flex items-center gap-3">
          <Clock size={36} className="text-yellow-500" />
          Expiring Soon Membership
        </h1>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm w-72 text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {expiringMembers.length === 0 && (
          <p className="text-gray-500 col-span-full text-center text-2xl">
            No memberships expiring soon.
          </p>
        )}

        {expiringMembers.map((member) => (
          <div
            key={member._id}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition duration-300 cursor-pointer"
            onClick={() => setSelectedMember(member)}
          >
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-3">
              <User size={24} className="text-red-500" /> {member.name}
            </h2>

            <div className="space-y-2 text-gray-700 text-lg">
              <p className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                Joined: {new Date(member.date).toLocaleDateString("en-GB")}
              </p>
              <p className="flex items-center gap-2">
                <CreditCard size={18} className="text-green-600" />
                Plan: {member.plan}
              </p>
              <p className="flex items-center gap-2">
                <Calendar size={18} className="text-red-500" />
                Expiring On:{" "}
                {calculateExpiryDateObj(
                  member.date,
                  member.plan
                ).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
