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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

  // ✅ Export PDF (supports custom date range)
  const exportPDF = async (useCustom = false) => {
    const doc = new jsPDF("p", "pt", "a4");
    const fmt = (a: number) => `Rs. ${a.toLocaleString("en-IN")}`;
    const logoPath = "/Layer 0 Frame.png";

    const logoData = await fetch(logoPath)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          })
      );

    const monthName = monthNames[selectedMonth];
    const generatedDate = new Date().toLocaleDateString("en-GB");

    doc.addImage(logoData, "PNG", 40, 25, 60, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("REVENUE REPORT", 120, 50);

    doc.setFontSize(12);
    if (useCustom && customStart && customEnd) {
      doc.text(
        `Custom Range: ${new Date(customStart).toLocaleDateString(
          "en-GB"
        )} - ${new Date(customEnd).toLocaleDateString("en-GB")}`,
        120,
        70
      );
    } else {
      doc.text(`Month: ${monthName} ${selectedYear}`, 120, 70);
    }
    doc.text(`Generated on: ${generatedDate}`, 120, 85);

    // ---- TABLE ----
    autoTable(doc, {
      startY: 110,
      head: [["Category", "Amount (Rs.)"]],
      body: [
        ["Membership Revenue", fmt(totalMemberRevenue)],
        ["Coach Salaries", fmt(totalCoachSalary)],
        ["Miscellaneous Expenses", fmt(totalMisc)],
        ["Electricity Bills", fmt(totalElectricity)],
        ["Total Revenue", fmt(totalRevenue)],
      ],
      // 🟨 Header Styling
      headStyles: {
        fillColor: [255, 204, 0], // bright yellow (gym theme)
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        fontSize: 12,
        lineWidth: 0.2,
        lineColor: [0, 0, 0],
      },
      // 🧾 Row Styling
      styles: {
        fontSize: 10,
        halign: "center",
        textColor: [0, 0, 0],
        cellPadding: 8,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      // 🦓 Alternate Row Colors (Zebra stripes)
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      // 🏁 Highlight the Total Revenue row
      didParseCell: (data) => {
        if (
          data.row.index === 4 && // last row
          data.section === "body"
        ) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [255, 230, 153]; // light yellow highlight
        }
      },
      margin: { left: 40, right: 40 },
    });

    let y = (doc as any).lastAutoTable.finalY + 40;

    // ---- MEMBER PAYMENTS ----
    if (memberPayments.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("MEMBER PAYMENTS", 40, y);
      y += 10;
      const rows = memberPayments.map((p, i) => [
        i + 1,
        p.memberName,
        p.plan,
        p.date,
        fmt(p.amount),
        p.mode,
      ]);
      autoTable(doc, {
        head: [["Sr.No", "Member Name", "Plan", "Date", "Amount", "Mode"]],
        body: rows,
        startY: y + 10,
        styles: { fontSize: 9, textColor: [0, 0, 0] },
        margin: { left: 40, right: 40 },
      });
      y = (doc as any).lastAutoTable.finalY + 35;
    }

    // ---- COACH SALARIES ----
    if (coachPayments.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("COACH SALARY PAYMENTS", 40, y);
      y += 10;
      const rows = coachPayments.map((s, i) => [
        i + 1,
        s.coachName,
        s.date,
        fmt(s.amount),
      ]);
      autoTable(doc, {
        head: [["Sr.No", "Coach Name", "Paid On", "Amount (Rs.)"]],
        body: rows,
        startY: y + 10,
        styles: { fontSize: 9, textColor: [0, 0, 0] },
        margin: { left: 40, right: 40 },
      });
      y = (doc as any).lastAutoTable.finalY + 35;
    }

    // ---- MISCELLANEOUS ----
    if (filteredMisc.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("MISCELLANEOUS EXPENSES", 40, y);
      y += 10;
      const rows = filteredMisc.map((m, i) => [
        i + 1,
        m.name,
        new Date(m.date).toLocaleDateString("en-GB"),
        fmt(m.amount),
      ]);
      autoTable(doc, {
        head: [["Sr.No", "Expense Name", "Date", "Amount (Rs.)"]],
        body: rows,
        startY: y + 10,
        styles: { fontSize: 9, textColor: [0, 0, 0] },
        margin: { left: 40, right: 40 },
      });
      y = (doc as any).lastAutoTable.finalY + 35;
    }

    // ---- ELECTRICITY BILLS ----
    if (filteredElectricity.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("ELECTRICITY BILLS", 40, y);
      y += 10;
      const rows = filteredElectricity.map((e, i) => [
        i + 1,
        e.month,
        e.year,
        fmt(e.amount),
      ]);
      autoTable(doc, {
        head: [["Sr.No", "Month", "Year", "Amount (Rs.)"]],
        body: rows,
        startY: y + 10,
        styles: { fontSize: 9, textColor: [0, 0, 0] },
        margin: { left: 40, right: 40 },
      });
      y = (doc as any).lastAutoTable.finalY + 25;
    }

    // FOOTER
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);

    // SAVE PDF
    doc.save(
      useCustom && customStart && customEnd
        ? `Gym_Revenue_Report_${customStart}_to_${customEnd}.pdf`
        : `Gym_Revenue_Report_${monthName}_${selectedYear}.pdf`
    );
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <BarChart2 size={36} className="text-yellow-500" />
          <h1 className="text-[42px] font-bold text-[#0A2463]">
            Revenue Report
          </h1>
        </div>

        {/* Month Selector */}
        <div className="flex flex-wrap gap-3 items-center bg-white shadow-md border border-gray-200 px-5 py-3 rounded-2xl">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-2 px-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-400 text-gray-800 font-medium"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 px-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-yellow-50 focus:ring-2 focus:ring-yellow-400 text-gray-800 font-medium"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>

          <button
            onClick={() => exportPDF(false)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg shadow font-semibold transition"
          >
            Export PDF
          </button>

          {/* ✅ Custom Range Inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
            />
            <span className="font-semibold text-gray-600">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-800"
            />
          </div>

          <button
            onClick={() => exportPDF(true)}
            disabled={!customStart || !customEnd}
            className={`px-5 py-2 rounded-lg shadow font-semibold transition ${
              customStart && customEnd
                ? "bg-[#0A2463] hover:bg-[#152b7a] text-white"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
            }`}
          >
            Export Custom PDF
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <SummaryCard title="Membership Revenue" value={totalMemberRevenue} icon="green" />
        <SummaryCard title="Coach Salaries" value={totalCoachSalary} icon="red" />
        <SummaryCard title="Miscellaneous" value={totalMisc} icon="blue" />
        <SummaryCard title="Electricity Bills" value={totalElectricity} icon="yellow" />
      </div>

      {/* CHART */}
      <div className="bg-white p-6 rounded-2xl shadow mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-[#0A2463]">
            Summary Chart - {monthNames[selectedMonth]} {selectedYear}
          </h2>
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-xl">
            <button
              onClick={() => setChartType("bar")}
              className={`p-2 rounded-lg flex items-center gap-1 ${
                chartType === "bar"
                  ? "bg-yellow-500 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <BarIcon size={18} /> Bar
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`p-2 rounded-lg flex items-center gap-1 ${
                chartType === "pie"
                  ? "bg-yellow-500 text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <PieIcon size={18} /> Pie
            </button>
          </div>
        </div>

        <div className="h-80">
          {chartType === "bar" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="amount" fill="#facc15" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                <Legend />
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
    green: "text-green-500",
    red: "text-red-500",
    blue: "text-blue-500",
    yellow: "text-yellow-500",
  };
  const icons = {
    green: <CreditCard size={40} className={colors.green} />,
    red: <Users size={40} className={colors.red} />,
    blue: <FileText size={40} className={colors.blue} />,
    yellow: <Calendar size={40} className={colors.yellow} />,
  };
  return (
    <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4 transition-transform transform hover:scale-105">
      {icons[icon]}
      <div>
        <p className="text-gray-500 text-lg">{title}</p>
        <p className="text-2xl font-bold">₹{value.toLocaleString("en-IN")}</p>
      </div>
    </div>
  );
}