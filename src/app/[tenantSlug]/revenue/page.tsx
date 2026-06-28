"use client";

import { useEffect, useState } from "react";
import {
  BarChart2,
  CreditCard,
  Calendar,
  Users,
  FileText,
  BarChart as BarIcon,
  PieChart as PieIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Installment = {
  amountPaid: number;
  paymentDate: string;
  modeOfPayment: string;
};

type Payment = {
  plan: string;
  actualAmount: number;
  installments: Installment[];
};

type Member = {
  _id: string;
  name: string;
  payments: Payment[];
};

type Salary = {
  amountPaid: number;
  paidOn: string;
};

type Coach = {
  _id: string;
  name: string;
  salaryHistory: Salary[];
};

type MiscCost = {
  _id: string;
  name: string;
  date: string;
  amount: number;
};

type ElectricityBill = {
  _id: string;
  month: string;
  year: number;
  amount: number;
  date: string;
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COLORS = ["#22C55E", "#EF4444", "#3B82F6", "#FACC15"];

export default function RevenuePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [miscCosts, setMiscCosts] = useState<MiscCost[]>([]);
  const [electricityBills, setElectricityBills] = useState<ElectricityBill[]>(
    []
  );
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // ✅ New states for custom date range
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [exporting, setExporting] = useState(false);

  // ✅ Detect mobile to tweak charts
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 640); // Tailwind "sm"
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memberRes, coachRes, miscRes, elecRes] = await Promise.all([
          fetch("/api/members"),
          fetch("/api/coach"),
          fetch("/api/miscellaneous"),
          fetch("/api/electricity-bill"),
        ]);

        const memberData = await memberRes.json();
        const coachData = await coachRes.json();
        const miscData = await miscRes.json();
        const elecData = await elecRes.json();

        setMembers(memberData.members || []);
        setCoaches(coachData.coaches || []);
        setMiscCosts(miscData.costs || []);
        setElectricityBills(elecData.bills || []);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const matchesSelectedMonth = (date: string | Date) => {
    const d = new Date(date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  };

  // Transformations
  const memberPayments = members.flatMap((m) =>
    (m.payments || []).flatMap((p) =>
      (p.installments || [])
        .filter((i) => matchesSelectedMonth(i.paymentDate))
        .map((i) => ({
          memberName: m.name,
          plan: p.plan,
          amount: i.amountPaid,
          date: new Date(i.paymentDate).toLocaleDateString("en-GB"),
          mode: i.modeOfPayment || "Cash",
        }))
    )
  );

  const coachPayments = coaches.flatMap((c) =>
    (c.salaryHistory || [])
      .filter((s) => matchesSelectedMonth(s.paidOn))
      .map((s) => ({
        coachName: c.name,
        amount: s.amountPaid,
        date: new Date(s.paidOn).toLocaleDateString("en-GB"),
      }))
  );

  const filteredMisc = miscCosts.filter((m) => matchesSelectedMonth(m.date));
  const filteredElectricity = electricityBills.filter(
    (e) =>
      monthNames.indexOf(e.month) === selectedMonth && e.year === selectedYear
  );

  const totalMemberRevenue = memberPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  const totalCoachSalary = coachPayments.reduce((sum, s) => sum + s.amount, 0);
  const totalMisc = filteredMisc.reduce((sum, m) => sum + m.amount, 0);
  const totalElectricity = filteredElectricity.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const totalRevenue =
    totalMemberRevenue - totalCoachSalary - totalMisc - totalElectricity;

  const chartData = [
    { name: "Membership", amount: totalMemberRevenue },
    { name: "Coach Salaries", amount: totalCoachSalary },
    { name: "Miscellaneous", amount: totalMisc },
    { name: "Electricity", amount: totalElectricity },
  ];

  // ✅ Shorter labels on mobile for X axis
  const shortLabel = (value: string) => {
    if (!isMobile) return value;
    switch (value) {
      case "Membership":
        return "Member";
      case "Coach Salaries":
        return "Coach";
      case "Miscellaneous":
        return "Misc";
      case "Electricity":
        return "Elec";
      default:
        return value;
    }
  };

  // ✅ Export PDF by calling Next.js API reports
  const exportPDF = async (useCustom = false) => {
    try {
      setExporting(true);
      let url = `/api/reports/financial`;
      if (useCustom && customStart && customEnd) {
        url += `?from=${customStart}&to=${customEnd}`;
      } else {
        url += `?month=${selectedMonth}&year=${selectedYear}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to export financial report");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const filename = useCustom
        ? `Gym_Revenue_Report_${customStart}_to_${customEnd}.pdf`
        : `Gym_Revenue_Report_${monthNames[selectedMonth]}_${selectedYear}.pdf`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Error exporting PDF");
    } finally {
      setExporting(false);
    }
  };

  const filterSelectClass =
    "w-full sm:w-auto px-3 py-2 rounded-xl border-[#2A2A2A] " +
    "bg-[#050505] text-xs sm:text-sm text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer font-medium";

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <BarChart2 size={24} />
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316]">
            Revenue Report
          </h1>
        </div>

        {/* Month / Year / Export controls */}
        <div className="w-full md:w-auto glass-card px-4 py-3.5 rounded-2xl border-[#2A2A2A] flex flex-col lg:flex-row gap-3 lg:items-center">
          {/* Month & Year */}
          <div className="flex sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={filterSelectClass}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i} className="bg-[#121212]">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className={filterSelectClass}
            >
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(
                (y) => (
                  <option key={y} value={y} className="bg-[#121212]">
                    {y}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Standard PDF button */}
          <button
            onClick={() => exportPDF(false)}
            disabled={exporting}
            className="btn-primary w-full sm:w-auto px-5 py-2 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer transition disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "Export PDF"}
          </button>

          {/* Custom Range */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="input-dark flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm"
              />
              <span className="font-semibold text-zinc-400 text-xs sm:text-sm">
                to
              </span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="input-dark flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm"
              />
            </div>

            <button
              onClick={() => exportPDF(true)}
              disabled={!customStart || !customEnd || exporting}
              className={`w-full sm:w-auto px-5 py-2 rounded-xl shadow font-headline text-lg tracking-wider transition ${
                customStart && customEnd && !exporting
                  ? "bg-[#f97316] hover:bg-[#ff8c3a] text-white cursor-pointer"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
              }`}
            >
              {exporting ? "Exporting..." : "Export Custom PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Membership Revenue"
          value={totalMemberRevenue}
          icon="green"
        />
        <SummaryCard
          title="Coach Salaries"
          value={totalCoachSalary}
          icon="red"
        />
        <SummaryCard title="Miscellaneous" value={totalMisc} icon="blue" />
        <SummaryCard
          title="Electricity Bills"
          value={totalElectricity}
          icon="yellow"
        />
      </div>

      {/* CHART */}
      <div className="glass-card px-4 sm:px-6 lg:px-8 py-5 rounded-2xl border-[#2A2A2A] mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] uppercase">
            Summary Chart – {monthNames[selectedMonth]} {selectedYear}
          </h2>
          <div className="self-start sm:self-auto flex items-center gap-2 bg-[#050505] border-[#2A2A2A] px-2 py-1 rounded-xl">
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-headline text-sm tracking-wider cursor-pointer ${
                chartType === "bar"
                  ? "bg-[#f97316] text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <BarIcon size={14} /> Bar
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-headline text-sm tracking-wider cursor-pointer ${
                chartType === "pie"
                  ? "bg-[#f97316] text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <PieIcon size={14} /> Pie
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-80">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={
                  isMobile
                    ? { top: 10, right: 10, left: 0, bottom: 30 }
                    : { top: 20, right: 20, left: 0, bottom: 40 }
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="name"
                  tickFormatter={shortLabel}
                  interval={0}
                  tick={{
                    fontSize: isMobile ? 10 : 12,
                    fill: "#a1a1aa",
                  }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: isMobile ? 10 : 12, fill: "#a1a1aa" }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", color: "#e5e2e1" }}
                  itemStyle={{ color: "#e5e2e1" }}
                  formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                />
                <Bar dataKey="amount" fill="#f97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart
                margin={
                  isMobile
                    ? { top: 0, right: 0, bottom: 60, left: 0 }
                    : { top: 10, right: 20, bottom: 50, left: 20 }
                }
              >
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy={isMobile ? "55%" : "55%"}
                  outerRadius={isMobile ? 80 : 110}
                  label={!isMobile}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", color: "#e5e2e1" }}
                  itemStyle={{ color: "#e5e2e1" }}
                  formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{
                    fontSize: isMobile ? 10 : 12,
                    color: "#a1a1aa",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: "green" | "red" | "blue" | "yellow";
}) {
  const colors: Record<string, string> = {
    green: "text-[#22c55e]",
    red: "text-red-400",
    blue: "text-blue-400",
    yellow: "text-[#f97316]",
  };
  const icons = {
    green: <CreditCard size={32} className={colors.green} />,
    red: <Users size={32} className={colors.red} />,
    blue: <FileText size={32} className={colors.blue} />,
    yellow: <Calendar size={32} className={colors.yellow} />,
  };

  return (
    <div className="w-full glass-card px-5 py-5 rounded-2xl border-[#2A2A2A] flex items-center gap-3 sm:gap-4 transition-transform hover:scale-[1.02] shadow-lg">
      <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
        {icons[icon]}
      </div>
      <div>
        <p className="text-zinc-400 text-sm sm:text-base font-medium">{title}</p>
        <p className="text-2xl font-headline tracking-wide text-[#e5e2e1] mt-0.5">
          ₹{value.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}
