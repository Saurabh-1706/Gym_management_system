"use client";

import { useEffect, useState } from "react";
import { BarChart2, CreditCard } from "lucide-react";
import Link from "next/link";

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
  mobile: string;
  payments?: Payment[];
};

type PaymentWithMember = Payment & {
  memberName: string;
  memberId: string;
  memberMobile: string; // ✅ add mobile number
};

export default function ReportPage() {
  const [payments, setPayments] = useState<PaymentWithMember[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      const res = await fetch("/api/members");
      const data = await res.json();

      if (Array.isArray(data.members)) {
        const allPayments: PaymentWithMember[] = data.members.flatMap(
          (m: Member) =>
            (m.payments || []).map((p) => ({
              ...p,
              memberName: m.name,
              memberId: m._id,
              memberMobile: m.mobile, // ✅ include mobile
            }))
        );

        allPayments.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setPayments(allPayments);
      } else {
        setPayments([]);
      }
    };
    fetchPayments();
  }, []);

  // Filter payments based on date and search
  const filteredPayments = payments.filter((p) => {
    const paymentDate = new Date(p.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const matchesDate =
      (!start || paymentDate >= start) && (!end || paymentDate <= end);
    const matchesSearch =
      p.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plan.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDate && matchesSearch;
  });

  const totalRevenue = filteredPayments.reduce(
    (acc, p) => acc + (p.price || 0),
    0
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 size={36} className="text-yellow-500" />
        <h1 className="text-[42px] font-bold text-[#0A2463]"> Report</h1>
      </div>

      {/* Date range + revenue */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex items-center gap-2 text-gray-800">
          <label className="font-semibold text-xl">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 shadow-md
                 text-gray-900 text-lg focus:outline-none focus:ring-2
                 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
                 hover:shadow-lg"
          />
        </div>

        <div className="flex items-center gap-2 text-gray-800">
          <label className="font-semibold text-xl">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-3 rounded-xl border border-gray-300 shadow-md
                 text-gray-900 text-lg focus:outline-none focus:ring-2
                 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
                 hover:shadow-lg"
          />
        </div>

        <div className="bg-white p-5 rounded-2xl shadow flex items-center gap-4 ml-auto transition-transform transform hover:scale-105">
          <CreditCard size={40} className="text-green-500" />
          <div>
            <p className="text-gray-500 text-lg">Membership Revenue</p>
            <p className="text-2xl font-bold">₹{totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* Payment history table */}
      <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by member or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 shadow-md
               text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2
               focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
               hover:shadow-lg"
            />
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-yellow-500 text-white uppercase text-xl">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Sr.No.</th>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Mobile</th>
              <th className="px-6 py-3 text-left font-semibold">Plan</th>
              <th className="px-6 py-3 text-left font-semibold">Date</th>
              <th className="px-6 py-3 text-left font-semibold">Amount</th>
              <th className="px-6 py-3 text-left font-semibold">Mode</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 divide-y text-xl divide-gray-200">
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-400">
                  No payments found.
                </td>
              </tr>
            )}
            {filteredPayments.map((p, index) => (
              <tr
                key={p._id}
                className={`transition-transform transform hover:scale-[1.01] hover:shadow-md ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                }`}
              >
                <td className="px-6 py-4 font-medium">{index + 1}</td>
                <td className="px-6 py-4 font-medium hover:text-blue-900 cursor-pointer">
                  <Link href={`/members/${p.memberId}`}>{p.memberName}</Link>
                </td>
                <td className="px-6 py-4 font-semibold">{p.memberMobile}</td>
                <td className="px-6 py-4 font-semibold">{p.plan}</td>
                <td className="px-6 py-4">
                  {new Date(p.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-6 py-4 font-semibold">₹{p.price}</td>
                <td className="px-6 py-4">{p.modeOfPayment || "Cash"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
