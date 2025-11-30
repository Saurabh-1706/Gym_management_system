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
    ? date.toLocaleDateString("en-GB") // dd/mm/yyyy
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
      console.log("📌 API data:", data);
      if (data.success && Array.isArray(data.members)) {
        setMembers(data.members);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error("❌ Failed to fetch members:", err);
      setMembers([]);
    }
  };

  // ✅ Fetch on first load + whenever date range changes
  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  return (
    <div className="px-3 sm:px-5 lg:px-8 py-4 sm:py-6 bg-[#E9ECEF] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <Users size={32} className="text-yellow-500" />
        <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold text-[#0A2463]">
          New Joinee Report
        </h1>
      </div>

      {/* Date Filters + Summary */}
      <div className="flex lg:flex-row flex-wrap gap-4 lg:gap-6 items-stretch mb-6">
        {/* From */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-800">
          <label className="font-semibold text-base sm:text-lg">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 sm:px-4 py-2.5 rounded-xl border border-gray-300 shadow-md
              text-gray-900 text-sm sm:text-lg focus:outline-none focus:ring-2
              focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
              hover:shadow-lg bg-white"
          />
        </div>

        {/* To */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-800">
          <label className="font-semibold text-base sm:text-lg">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 sm:px-4 py-2.5 rounded-xl border border-gray-300 shadow-md
              text-gray-900 text-sm sm:text-lg focus:outline-none focus:ring-2
              focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
              hover:shadow-lg bg-white"
          />
        </div>

        {/* New Joinee Summary Card */}
        <div className="lg:ml-auto w-full sm:w-auto bg-white p-4 sm:p-5 rounded-2xl shadow flex items-center gap-3 sm:gap-4 transition-transform transform hover:scale-105">
          <Users size={32} className="text-blue-500" />
          <div>
            <p className="text-gray-500 text-sm sm:text-lg">New Joinees</p>
            <p className="text-xl sm:text-2xl font-bold">{members.length}</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6 overflow-x-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
          New Members
        </h2>
        <div className="table-scroll rounded-2xl border border-slate-100">
          <table className="w-full text-xs sm:text-sm lg:text-base">
            <thead className="bg-yellow-500 text-white uppercase text-xs sm:text-sm lg:text-xl">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  #
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  Mobile
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  Plan
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  Join Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 divide-y text-xs sm:text-sm lg:text-xl divide-gray-200">
              {members.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-400 text-sm sm:text-base"
                  >
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
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-medium">
                    {m.name}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">{m.mobile}</td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold">
                    {m.plan || "No Plan"}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    {formatDate(m.joinDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
