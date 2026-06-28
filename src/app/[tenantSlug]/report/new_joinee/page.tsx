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
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body text-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
          <Users size={24} />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] uppercase">
          New Joinee Report
        </h1>
      </div>

      {/* Date Filters + Summary */}
      <div className="flex lg:flex-row flex-wrap gap-4 lg:gap-6 items-stretch mb-6">
        {/* From */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[#e5e2e1]">
          <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest block ml-1 whitespace-nowrap">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input-dark px-3 sm:px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
          />
        </div>

        {/* To */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[#e5e2e1]">
          <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest block ml-1 whitespace-nowrap">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input-dark px-3 sm:px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
          />
        </div>

        {/* New Joinee Summary Card */}
        <div className="lg:ml-auto w-full sm:w-auto glass-card border-[#2A2A2A] px-5 py-4 rounded-xl flex items-center gap-3 sm:gap-4 transition-transform hover:scale-[1.02] shadow-lg text-left">
          <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
            <Users size={24} className="text-blue-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">New Joinees</p>
            <p className="text-2xl font-headline tracking-wider text-[#e5e2e1]">{members.length}</p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-card border-[#2A2A2A] p-4 sm:p-6 shadow-lg">
        <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-6 uppercase">
          New Members
        </h2>
        <div className="w-full overflow-x-auto">
          <div className="rounded-xl border-[#2A2A2A] overflow-hidden bg-[#0A0A0A]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="table-thead">
                <tr>
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Mobile</th>
                  <th className="px-5 py-3.5">Plan</th>
                  <th className="px-5 py-3.5">Join Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {members.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-zinc-500 text-sm sm:text-base font-medium uppercase tracking-wider"
                    >
                      No members found in this range.
                    </td>
                  </tr>
                )}
                {members.map((m, index) => (
                  <tr
                    key={m._id}
                    className="hover:bg-white/5 transition"
                  >
                    <td className="px-5 py-3.5 text-zinc-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#e5e2e1]">
                      {m.name}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{m.mobile}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#f97316]">
                      {m.plan || "No Plan"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      {formatDate(m.joinDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
