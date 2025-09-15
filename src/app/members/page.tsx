'use client';

import { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Trash2,
  Edit,
  Users,
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
  validity: number;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("All");

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch("/api/members");
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    };
    fetchMembers();
  }, []);

  // Fetch plans for dropdown
  useEffect(() => {
    const fetchPlans = async () => {
      const res = await fetch("/api/plans");
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    };
    fetchPlans();
  }, []);

  // Calculate expiry
  const calculateExpiryDate = (joinDate: string, plan: string) => {
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
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    const res = await fetch(`/api/members/${selectedMember._id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m._id !== selectedMember._id));
      setShowDeleteModal(false);
      setSelectedMember(null);
    } else alert("Delete failed");
  };

  const handleSaveEdit = async () => {
    if (!selectedMember) return;
    // Validation
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
      setMembers((prev) =>
        prev.map((m) => (m._id === selectedMember._id ? selectedMember : m))
      );
      setSelectedMember({ ...selectedMember, editMode: false });
    } else alert("Update failed");
  };

  const filteredMembers = members.filter((m) => {
    const matchesSearch = m.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPlan = selectedPlan === "All" || m.plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-[42px] font-bold text-yellow-500 flex items-center gap-3">
          <Users size={42} className="text-yellow-500" />
          View Members
        </h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 shadow-sm w-52 text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
            />
          </div>

          {/* Filter menu */}
          <div className="relative w-52">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full appearance-none border border-gray-300 rounded-xl py-2 pl-4 pr-10 text-gray-200 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 cursor-pointer"
            >
              <option value="All">All Plans</option>
              {plans
                .sort((a, b) => a.validity - b.validity)
                .map((plan) => (
                  <option key={plan._id} value={plan.name} className="text-gray-700">
                    {plan.name}
                  </option>
                ))}
            </select>

            {/* Custom arrow icon */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Title + Total Members */}
      <div className="flex items-center mb-6">
        <span className="ml-auto text-2xl font-semibold text-gray-100">
          Total Members: {filteredMembers.length}
        </span>
      </div>

      {/* Members Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member, index) => (
          <div
            key={member._id}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl hover:scale-[1.03] transition duration-300 cursor-pointer relative"
            onClick={() => setSelectedMember({ ...member, editMode: false })}
          >
            {/* Registration number */}
            <span className="absolute top-3 left-3 text-sm font-semibold text-gray-700">
              #{index + 1}
            </span>

            <h2 className="text-2xl font-bold text-[#1f1f4a] flex items-center gap-2 px-4 mb-3">
              <User size={24} className="text-yellow-500" />
              {member.name}
            </h2>

            <div className="space-y-2 text-gray-700 px-4 text-[16px]">
              <p className="flex items-center gap-2 text-lg">
                <Calendar size={18} className="text-blue-500" />
                Joined: {new Date(member.date).toLocaleDateString("en-GB")}
              </p>
              <p className="flex items-center gap-2">
                <CreditCard size={18} className="text-green-600" />
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-base font-semibold">
                  {member.plan}
                </span>
              </p>
              <p className="flex items-center gap-2 text-lg">
                <Phone size={18} className="text-purple-500" />
                {member.mobile}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Backdrop */}
      {(selectedMember || showDeleteModal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"></div>
      )}

      {/* Member Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 shadow-2xl w-full max-w-2xl relative">
            <button
              className="absolute top-3 right-4 text-gray-500 text-2xl hover:text-red-600"
              onClick={() => setSelectedMember(null)}
            >
              &times;
            </button>

            {selectedMember.editMode ? (
              <div className="backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-center mb-6">
                  Edit {selectedMember.name}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold">Mobile</label>
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
                    />
                  </div>
                  <div>
                    <label className="font-semibold">Email</label>
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
                    />
                  </div>
                  <div>
                    <label className="font-semibold">Date Joined</label>
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
                  </div>
                  <div>
                    <label className="font-semibold">Plan</label>
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
              <>
                <h2 className="text-4xl font-bold text-center text-[#1f1f4a] mb-6">
                  {selectedMember.name}
                </h2>

                <div className="space-y-4 text-[18px] text-gray-800">
                  <p className="flex items-center gap-2">
                    <Phone size={20} className="text-purple-500" />
                    <strong>Mobile:</strong> {selectedMember.mobile}
                  </p>
                  {selectedMember.email && (
                    <p className="flex items-center gap-2">
                      <Mail size={20} className="text-red-400" />
                      <strong>Email:</strong> {selectedMember.email}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Calendar size={20} className="text-blue-500" />
                    <strong>Date Joined:</strong>{" "}
                    {new Date(selectedMember.date).toLocaleDateString("en-GB")}
                  </p>
                  <p className="flex items-center gap-2">
                    <CreditCard size={20} className="text-green-600" />
                    <strong>Plan:</strong> {selectedMember.plan}
                  </p>
                  {selectedMember.price && (
                    <p className="flex items-center gap-2">
                      <CreditCard size={20} className="text-yellow-500" />
                      <strong>Price:</strong> ₹{selectedMember.price}
                    </p>
                  )}
                  <p className="text-red-600 font-semibold">
                    Membership Ends:{" "}
                    {calculateExpiryDate(selectedMember.date, selectedMember.plan)}
                  </p>
                </div>

                <div className="flex justify-center mt-6 gap-4">
                  <button
                    onClick={() =>
                      setSelectedMember({ ...selectedMember, editMode: true })
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2 "
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 z-60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md relative">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Are you sure you want to delete {selectedMember.name}?
            </h3>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>

              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition"
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
