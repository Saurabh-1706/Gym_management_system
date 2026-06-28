"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useParams } from "next/navigation";

type Member = {
  _id: string;
  name: string;
  mobile: string;
  plan?: string;
  status?: string;
};

type AttendanceRecord = {
  memberId: string;
  name: string;
  mobile: string;
  totalPresent: number;
  totalAbsent: number;
  rate: number;
  markedToday?: "present" | "absent" | null;
};

export default function AttendancePage() {
  const { tenantSlug } = useParams();
  const [members, setMembers] = useState<Member[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "low" | "high">("all");
  const [customStart, setCustomStart] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]
  );
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split("T")[0]);
  const [exporting, setExporting] = useState(false);

  // Deterministic mock data generation
  const getMockAttendance = (memberId: string, name: string, mobile: string): AttendanceRecord => {
    const seed = memberId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const totalPresent = 10 + (seed % 21);
    const totalAbsent = seed % 16;
    const totalDays = totalPresent + totalAbsent;
    const rate = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;

    return {
      memberId,
      name,
      mobile,
      totalPresent,
      totalAbsent,
      rate,
      markedToday: null,
    };
  };

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (res.ok) {
          const data = await res.json();
          const membersArray = Array.isArray(data)
            ? data
            : Array.isArray(data.members)
            ? data.members
            : data.data || [];
          setMembers(membersArray);

          // Generate records
          const recs = membersArray.map((m: Member) =>
            getMockAttendance(m._id, m.name, m.mobile)
          );
          setRecords(recs);
        }
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };
    fetchMembers();
  }, []);

  const handleToggleAttendance = (memberId: string, status: "present" | "absent") => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.memberId !== memberId) return rec;

        // If toggling the same, clear it
        if (rec.markedToday === status) {
          const adjustedPresent = status === "present" ? rec.totalPresent - 1 : rec.totalPresent;
          const adjustedAbsent = status === "absent" ? rec.totalAbsent - 1 : rec.totalAbsent;
          const total = adjustedPresent + adjustedAbsent;
          return {
            ...rec,
            markedToday: null,
            totalPresent: adjustedPresent,
            totalAbsent: adjustedAbsent,
            rate: total > 0 ? (adjustedPresent / total) * 100 : 0,
          };
        }

        // Apply new status
        let newPresent = rec.totalPresent;
        let newAbsent = rec.totalAbsent;

        if (status === "present") {
          newPresent += 1;
          if (rec.markedToday === "absent") newAbsent -= 1;
        } else {
          newAbsent += 1;
          if (rec.markedToday === "present") newPresent -= 1;
        }

        const total = newPresent + newAbsent;
        return {
          ...rec,
          markedToday: status,
          totalPresent: newPresent,
          totalAbsent: newAbsent,
          rate: total > 0 ? (newPresent / total) * 100 : 0,
        };
      })
    );
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/reports/attendance?from=${customStart}&to=${customEnd}`);
      if (!res.ok) throw new Error("Failed to export report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_Report_${customStart}_to_${customEnd}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.mobile.includes(searchQuery);

    if (filterMode === "low") return matchesSearch && rec.rate < 50;
    if (filterMode === "high") return matchesSearch && rec.rate >= 50;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <UserCheck size={24} />
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316]">
            Attendance Telemetry
          </h1>
        </div>

        {/* Date Filters & Export */}
        <div className="w-full md:w-auto glass-card px-4 py-3 rounded-2xl border-[#2A2A2A] flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input-dark px-3 py-1.5 rounded-lg text-xs sm:text-sm"
            />
            <span className="font-semibold text-zinc-500 text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="input-dark px-3 py-1.5 rounded-lg text-xs sm:text-sm"
            />
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn-primary w-full sm:w-auto px-4 py-2 rounded-lg font-headline text-lg tracking-wider text-white shadow flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            <Download size={18} />
            {exporting ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search athlete name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#2A2A2A] bg-zinc-950/60 text-[#e5e2e1] focus:border-[#f97316] outline-none text-sm shadow-md"
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode("all")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
              filterMode === "all"
                ? "bg-[#f97316] border-[#f97316] text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMode("low")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
              filterMode === "low"
                ? "bg-red-550 border-red-550 text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-red-400"
            }`}
          >
            <AlertTriangle size={14} /> &lt; 50%
          </button>
          <button
            onClick={() => setFilterMode("high")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
              filterMode === "high"
                ? "bg-[#22c55e] border-[#22c55e] text-white"
                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-green-400"
            }`}
          >
            &gt;= 50%
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card rounded-xl border-[#2A2A2A] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-zinc-950/50 text-[#e0c0b1] font-headline tracking-wider text-sm">
                <th className="py-4 px-6">Athlete Name</th>
                <th className="py-4 px-6">Mobile</th>
                <th className="py-4 px-6 text-center">Present</th>
                <th className="py-4 px-6 text-center">Absent</th>
                <th className="py-4 px-6 text-center">Attendance %</th>
                <th className="py-4 px-6 text-right">Daily Check-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]/40 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-500">
                    No active members or logs found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isLow = rec.rate < 50;
                  return (
                    <tr key={rec.memberId} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex items-center gap-2">
                          <span className={isLow ? "text-red-400 font-bold" : "text-[#e5e2e1]"}>
                            {rec.name}
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] bg-red-950/40 text-red-400 border border-red-900/40">
                              <AlertTriangle size={10} /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-zinc-400">{rec.mobile}</td>
                      <td className="py-4 px-6 text-center text-zinc-300 font-semibold">
                        {rec.totalPresent}
                      </td>
                      <td className="py-4 px-6 text-center text-zinc-400">
                        {rec.totalAbsent}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              isLow ? "text-red-400" : "text-[#22c55e]"
                            }`}
                          >
                            {rec.rate.toFixed(1)}%
                          </span>
                          <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isLow ? "bg-red-550" : "bg-[#22c55e]"
                              }`}
                              style={{ width: `${Math.min(100, rec.rate)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleAttendance(rec.memberId, "present")}
                            className={`p-2 rounded-xl flex items-center justify-center transition border ${
                              rec.markedToday === "present"
                                ? "bg-[#22c55e]/15 border-[#22c55e] text-[#22c55e]"
                                : "border-zinc-800 hover:border-[#22c55e] text-zinc-500 hover:text-[#22c55e]"
                            }`}
                            title="Mark Present"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleAttendance(rec.memberId, "absent")}
                            className={`p-2 rounded-xl flex items-center justify-center transition border ${
                              rec.markedToday === "absent"
                                ? "bg-red-950/20 border-red-550 text-red-400"
                                : "border-zinc-800 hover:border-red-550 text-zinc-500 hover:text-red-400"
                            }`}
                            title="Mark Absent"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
