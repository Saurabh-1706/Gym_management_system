"use client";

import { useEffect, useState } from "react";
import { BarChart2, CreditCard, Calendar, Users, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Payment = {
  _id: string;
  plan: string;
  price: number;
  date: string;
  modeOfPayment?: string;
};

type Member = {
  _id: string;
  name: string;
  payments?: Payment[];
};

type Salary = {
  _id: string;
  amountPaid: number;
  paidOn: string;
};

type Coach = {
  _id: string;
  name: string;
  salaryHistory?: Salary[];
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

const isCurrentMonth = (dateString: string | Date) => {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
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

export default function RevenuePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [miscCosts, setMiscCosts] = useState<MiscCost[]>([]);
  const [electricityBills, setElectricityBills] = useState<ElectricityBill[]>(
    []
  );

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
        console.error("Error fetching revenue data:", err);
      }
    };
    fetchData();
  }, []);

  const filteredMembers = members
    .map((m) => ({
      ...m,
      payments: m.payments?.filter((p) => isCurrentMonth(p.date)),
    }))
    .filter((m) => m.payments && m.payments.length > 0);

  const filteredCoaches = coaches
    .map((c) => ({
      ...c,
      salaryHistory: c.salaryHistory?.filter((s) => isCurrentMonth(s.paidOn)),
    }))
    .filter((c) => c.salaryHistory && c.salaryHistory.length > 0);

  const filteredMisc = miscCosts.filter((m) => isCurrentMonth(m.date));
  const filteredElectricity = electricityBills.filter(
    (e) =>
      monthNames.indexOf(e.month) === new Date().getMonth() &&
      e.year === new Date().getFullYear()
  );

  const totalMemberRevenue = filteredMembers.reduce(
    (acc, m) => acc + m.payments!.reduce((sum, p) => sum + (p.price || 0), 0),
    0
  );

  const totalCoachSalary = filteredCoaches.reduce(
    (acc, c) =>
      acc + c.salaryHistory!.reduce((sum, s) => sum + (s.amountPaid || 0), 0),
    0
  );

  const totalMisc = filteredMisc.reduce((acc, m) => acc + m.amount, 0);
  const totalElectricity = filteredElectricity.reduce(
    (acc, e) => acc + e.amount,
    0
  );

  const totalRevenue =
    totalMemberRevenue - totalCoachSalary - totalMisc - totalElectricity;

  const exportPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");

    const formatAmount = (amount: number) =>
      "Rs." + amount.toLocaleString("en-IN");

    // --- Revenue Summary ---
    doc.setFontSize(20);
    doc.setFont("helvetica", "normal");
    doc.text("Revenue Summary", 40, 40);

    const cardStartY = 80;
    const cardGap = 20;
    const cardX = 40;

    doc.setFontSize(14);
    doc.text(
      `• Electricity Bills:- ${formatAmount(totalElectricity)}`,
      cardX,
      cardStartY
    );
    doc.text(
      `• Coach Salaries:- ${formatAmount(totalCoachSalary)}`,
      cardX,
      cardStartY + cardGap
    );
    doc.text(
      `• Membership Revenue:- ${formatAmount(totalMemberRevenue)}`,
      cardX,
      cardStartY + cardGap * 2
    );
    doc.text(
      `• Miscellaneous:- ${formatAmount(totalMisc)}`,
      cardX,
      cardStartY + cardGap * 3
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      `Total Revenue: ${formatAmount(totalRevenue)}`,
      cardX,
      cardStartY + cardGap * 5
    );

    let srNo = 1;
    let startY = cardStartY + cardGap * 8.5; // Start tables below Revenue Summary

    // --- ELECTRICITY BILLS ---
    if (filteredElectricity.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(
        `Electricity Bills - ${monthNames[new Date().getMonth()]}`,
        40,
        startY
      );
      startY += 20; // space after title

      const rows = filteredElectricity.map((e, idx) => [
        idx + 1,
        e.month,
        e.year,
        formatAmount(e.amount),
      ]);

      autoTable(doc, {
        head: [["Sr.No", "Month", "Year", "Amount"]],
        body: rows,
        startY: startY,
        styles: { fontSize: 10 },
        margin: { left: 40, right: 40 },
      });

      startY = (doc as any).lastAutoTable.finalY + 40; // Next table starts after this
    }

    // --- COACH SALARIES (same page) ---
    if (filteredCoaches.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(
        `Coach Salaries - ${monthNames[new Date().getMonth()]}`,
        40,
        startY
      );
      startY += 20;

      const rows: any[] = [];
      filteredCoaches.forEach((c) => {
        c.salaryHistory!.forEach((s, idx) => {
          rows.push([
            idx + 1,
            c.name,
            new Date(s.paidOn).toLocaleDateString("en-GB"),
            formatAmount(s.amountPaid),
          ]);
        });
      });

      autoTable(doc, {
        head: [["Sr.No", "Name", "Date", "Amount"]],
        body: rows,
        startY: startY,
        styles: { fontSize: 10 },
        margin: { left: 40, right: 40 },
      });

      startY = (doc as any).lastAutoTable.finalY + 20;
    }

    // --- MEMBER PAYMENTS (new page) ---
    if (filteredMembers.length > 0) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(
        `Member Payments - ${monthNames[new Date().getMonth()]}`,
        40,
        40
      );

      const memberRows: any[] = [];
      filteredMembers.forEach((m) => {
        m.payments!.forEach((p) => {
          memberRows.push([
            srNo++,
            m.name,
            p.plan,
            new Date(p.date).toLocaleDateString("en-GB"),
            formatAmount(p.price),
            p.modeOfPayment || "Cash",
          ]);
        });
      });

      autoTable(doc, {
        head: [["Sr.No", "Name", "Plan", "Date", "Amount", "Mode"]],
        body: memberRows,
        startY: 60,
        styles: { fontSize: 10 },
        margin: { left: 40, right: 40 },
      });
    }

    // --- MISC COSTS (new page) ---
    if (filteredMisc.length > 0) {
      doc.addPage();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(
        `Miscellaneous Costs - ${monthNames[new Date().getMonth()]}`,
        40,
        40
      );

      const rows = filteredMisc.map((m, idx) => [
        idx + 1,
        m.name,
        new Date(m.date).toLocaleDateString("en-GB"),
        formatAmount(m.amount),
      ]);

      autoTable(doc, {
        head: [["Sr.No", "Name", "Date", "Amount"]],
        body: rows,
        startY: 60,
        styles: { fontSize: 10 },
        margin: { left: 40, right: 40 },
      });
    }

    doc.save(
      `Revenue_Report_${
        monthNames[new Date().getMonth()]
      }_${new Date().getFullYear()}.pdf`
    );
  };

  let memberCounter = 1;

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={36} className="text-yellow-500" />
        <h1 className="text-[42px] font-bold text-[#0A2463]">Revenue Report</h1>
      </div>

      {/* CARDS */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4 transition-transform transform hover:scale-105">
          <CreditCard size={40} className="text-green-500" />
          <div>
            <p className="text-gray-500 text-lg">Membership Revenue</p>
            <p className="text-2xl font-bold">
              ₹{totalMemberRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4 transition-transform transform hover:scale-105">
          <Users size={40} className="text-red-500" />
          <div>
            <p className="text-gray-500 text-lg">Coach Salaries</p>
            <p className="text-2xl font-bold">
              ₹{totalCoachSalary.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4 transition-transform transform hover:scale-105">
          <FileText size={40} className="text-blue-500" />
          <div>
            <p className="text-gray-500 text-lg">Miscellaneous</p>
            <p className="text-2xl font-bold">
              ₹{totalMisc.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4 transition-transform transform hover:scale-105">
          <Calendar size={40} className="text-yellow-500" />
          <div>
            <p className="text-gray-500 text-lg">Electricity Bills</p>
            <p className="text-2xl font-bold">
              ₹{totalElectricity.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div
          onClick={exportPDF}
          className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-5 rounded-2xl shadow-xl flex items-center justify-between ml-auto cursor-pointer transition-transform transform hover:scale-105"
        >
          <BarChart2 size={36} className="opacity-80" />
          <div className="flex flex-col">
            <p className="text-lg font-medium opacity-90">Total Revenue</p>
            <p className="text-3xl font-extrabold mt-2">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* MEMBER PAYMENTS TABLE */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          Member Payments (Current Month)
        </h2>
        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden text-xl">
          <thead className="bg-yellow-500 text-white">
            <tr>
              <th className="px-6 py-3 text-left">Sr.No.</th>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Plan</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Amount</th>
              <th className="px-6 py-3 text-left">Mode</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y divide-gray-200">
            {filteredMembers.map((m) =>
              m.payments!.map((p, idx) => {
                const srNo = memberCounter++;
                return (
                  <tr key={`${m._id}-${p._id ?? idx}`}>
                    <td className="px-6 py-4">{srNo}</td>
                    <td className="px-6 py-4">{m.name}</td>
                    <td className="px-6 py-4">{p.plan}</td>
                    <td className="px-6 py-4">
                      {new Date(p.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4">
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">{p.modeOfPayment || "Cash"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* COACH SALARIES */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          Coach Salaries (Current Month)
        </h2>
        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden text-xl">
          <thead className="bg-red-500 text-white">
            <tr>
              <th className="px-6 py-3">Sr.No.</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y divide-gray-200">
            {filteredCoaches.map((c) =>
              c.salaryHistory!.map((s, idx) => (
                <tr
                  key={`${c._id}-${s._id ?? idx}`}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4">{idx + 1}</td>
                  <td className="px-6 py-4">{c.name}</td>
                  <td className="px-6 py-4">
                    {new Date(s.paidOn).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4">₹{s.amountPaid}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* MISC COSTS */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4">
          Miscellaneous Costs (Current Month)
        </h2>
        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden text-xl">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-6 py-3">Sr.No.</th>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y divide-gray-200">
            {filteredMisc.map((m, idx) => (
              <tr
                key={m._id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4">{idx + 1}</td>
                <td className="px-6 py-4">{m.name}</td>
                <td className="px-6 py-4">
                  {new Date(m.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-6 py-4">₹{m.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ELECTRICITY BILLS */}
      <section>
        <h2 className="text-2xl font-bold mb-4">
          Electricity Bills (Current Month)
        </h2>
        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden text-xl">
          <thead className="bg-yellow-500 text-white">
            <tr>
              <th className="px-6 py-3">Sr.No.</th>
              <th className="px-6 py-3">Month</th>
              <th className="px-6 py-3">Year</th>
              <th className="px-6 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y divide-gray-200">
            {filteredElectricity.map((e, idx) => (
              <tr
                key={e._id}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4">{idx + 1}</td>
                <td className="px-6 py-4">{e.month}</td>
                <td className="px-6 py-4">{e.year}</td>
                <td className="px-6 py-4">₹{e.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
