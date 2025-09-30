"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

type Member = {
  _id: string;
  name: string;
  mobile: string;
  joinDate: string;
  plan: string;
};

function formatDate(dateStr: string) {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return !isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB") // ✅ dd/mm/yyyy
    : "Invalid Date";
}

export default function NewJoineeReportPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchMembers = async () => {
    try {
      const query =
        from && to
          ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
          : "";
      const res = await fetch(`/api/members${query}`);
      const data = await res.json();
      console.log("📌 API data:", data); // 👈 check joinDate here
      if (data.success) {
        setMembers(data.members);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch members:", err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users size={36} className="text-yellow-500" />
        <h1 className="text-[42px] font-bold text-[#0A2463]">
          New Joinee Report
        </h1>
      </div>

      {/* Date Filters + Summary */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        {/* Filters on the left */}
        <div className="flex items-center gap-2 text-gray-800">
          <label className="font-semibold text-xl">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 shadow-md
              text-gray-900 text-lg focus:outline-none focus:ring-2
              focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
              hover:shadow-lg"
          />
        </div>

        <div className="flex items-center gap-2 text-gray-800">
          <label className="font-semibold text-xl">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 shadow-md
              text-gray-900 text-lg focus:outline-none focus:ring-2
              focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
              hover:shadow-lg"
          />
        </div>

        {/* New Joinee Summary Card on the right */}
        <div className="ml-auto bg-white p-4 rounded-2xl shadow flex items-center gap-4 transition-transform transform hover:scale-105">
          <Users size={40} className="text-blue-500" />
          <div>
            <p className="text-gray-500 text-lg">New Joinees</p>
            <p className="text-2xl font-bold">{members.length}</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">New Members</h2>

        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-yellow-500 text-white uppercase text-xl">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">#</th>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Mobile</th>
              <th className="px-6 py-3 text-left font-semibold">Plan</th>
              <th className="px-6 py-3 text-left font-semibold">Join Date</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y text-xl divide-gray-200">
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  No members found in this range.
                </td>
              </tr>
            )}
            {members.map((m, index) => (
              <tr
                key={m._id}
                className={`transition-transform transform hover:scale-[1.01] hover:shadow-md ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-6 py-4 font-medium">{index + 1}</td>
                <td className="px-6 py-4 font-medium">{m.name}</td>
                <td className="px-6 py-4">{m.mobile}</td>
                <td className="px-6 py-4 font-semibold">{m.plan}</td>
                <td className="px-6 py-4">{formatDate(m.joinDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
