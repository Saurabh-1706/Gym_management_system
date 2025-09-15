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
  XCircle,
  AlertOctagon,
} from "lucide-react";

type Member = {
  _id: string;
  name: string;
  date: string;
  plan: string;
  mobile: string;
  email?: string;
  price?: string;
  editMode?: boolean;
};

type Plan = {
  _id: string;
  name: string;
};

export default function ExpiredMembersPage() {
  const [expiredMembers, setExpiredMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch expired members
  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch("/api/members");
      const data: Member[] = await res.json();
      const today = new Date();
      const expired = data.filter(
        (m) => calculateExpiryDateObj(m.date, m.plan) < today
      );
      setExpiredMembers(expired);
    };
    fetchMembers();
  }, []);

  // Fetch plans for dropdown
  useEffect(() => {
    const fetchPlans = async () => {
      const res = await fetch("/api/plans");
      const data: Plan[] = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    };
    fetchPlans();
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

  const calculateExpiryDateFormatted = (joinDate: string, plan: string) => {
    return calculateExpiryDateObj(joinDate, plan).toLocaleDateString("en-GB");
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    const res = await fetch(`/api/members/${selectedMember._id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setExpiredMembers((prev) =>
        prev.filter((m) => m._id !== selectedMember._id)
      );
      setShowDeleteModal(false);
      setSelectedMember(null);
    } else alert("Delete failed");
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;
    if (
      !selectedMember.mobile ||
      !selectedMember.plan ||
      !selectedMember.date
    ) {
      alert("Please fill all required fields");
      return;
    }

    const res = await fetch(`/api/members/${selectedMember._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selectedMember),
    });

    if (res.ok) {
      setExpiredMembers((prev) =>
        prev.map((m) => (m._id === selectedMember._id ? selectedMember : m))
      );
      setSelectedMember({ ...selectedMember, editMode: false });
    } else alert("Update failed");
  };

  const filteredMembers = expiredMembers.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-red-500 flex items-center gap-3">
          <AlertOctagon size={36} className="text-red-500" />
          Expired Memberships
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

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length === 0 && (
          <p className="text-gray-500 col-span-full text-center text-2xl">
            No expired memberships.
          </p>
        )}

        {filteredMembers.map((member) => (
          <div
            key={member._id}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition duration-300 cursor-pointer"
            onClick={() => setSelectedMember({ ...member, editMode: false })}
          >
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-3">
              <User size={24} className="text-red-500" /> {member.name}
            </h2>

            <div className="space-y-2 text-gray-700 text-lg">
              <p className="flex items-center gap-2">
                <Phone size={18} className="text-purple-500" />
                <strong>Mobile: </strong>
                {member.mobile}
              </p>

              <p className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                <strong> Joined: </strong>
                {new Date(member.date).toLocaleDateString("en-GB")}
              </p>
              <p className="flex items-center gap-2">
                <CreditCard size={18} className="text-green-600" />
                <strong> Plan: </strong>{" "}
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  {member.plan}
                </span>
              </p>

              <p className="flex items-center gap-2">
                <Calendar size={18} className="text-red-500" />
                <strong>Expired On:</strong>{" "}
                {calculateExpiryDateFormatted(member.date, member.plan)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Member Modal for Edit/Delete */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-2xl relative">
            <button
              className="absolute top-3 right-4 text-gray-500 text-2xl hover:text-red-600"
              onClick={() => setSelectedMember(null)}
            >
              &times;
            </button>

            {selectedMember.editMode ? (
              <div>
                <h2 className="text-3xl font-bold mb-6 text-center">
                  Edit {selectedMember.name}
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={selectedMember.mobile}
                    onChange={(e) =>
                      setSelectedMember({
                        ...selectedMember,
                        mobile: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-gray-300"
                    placeholder="Mobile"
                  />
                  <input
                    type="email"
                    value={selectedMember.email || ""}
                    onChange={(e) =>
                      setSelectedMember({
                        ...selectedMember,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-gray-300"
                    placeholder="Email"
                  />
                  <input
                    type="date"
                    value={selectedMember.date.split("T")[0]}
                    onChange={(e) =>
                      setSelectedMember({
                        ...selectedMember,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-gray-300"
                  />
                  <select
                    value={selectedMember.plan}
                    onChange={(e) =>
                      setSelectedMember({
                        ...selectedMember,
                        plan: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded border border-gray-300"
                  >
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan.name}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() =>
                      setSelectedMember({ ...selectedMember, editMode: false })
                    }
                    className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-4xl font-bold text-center text-red-500 mb-6">
                  {selectedMember.name}
                </h2>
                <div className="space-y-4 text-gray-800 text-lg">
                  <p className="flex items-center gap-2">
                    <Phone size={18} className="text-purple-500" />{" "}
                    <strong>Mobile:</strong>
                    {selectedMember.mobile}
                  </p>
                  {selectedMember.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={18} className="text-red-400" />{" "}
                      <strong>Email:</strong>
                      {selectedMember.email}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" />{" "}
                    <strong>Joined:</strong>{" "}
                    {new Date(selectedMember.date).toLocaleDateString("en-GB")}
                  </p>
                  <p className="flex items-center gap-2">
                    <CreditCard size={18} className="text-green-600" />{" "}
                    <strong>Plan:</strong> {selectedMember.plan}
                  </p>
                  <p className="text-red-600 font-semibold">
                    Expired On:{" "}
                    {calculateExpiryDateFormatted(
                      selectedMember.date,
                      selectedMember.plan
                    )}
                  </p>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() =>
                      setSelectedMember({ ...selectedMember, editMode: true })
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md relative">
            <h3 className="text-xl font-semibold mb-4">
              Are you sure you want to delete {selectedMember.name}?
            </h3>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
