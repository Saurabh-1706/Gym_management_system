"use client";

import { useEffect, useState } from "react";
import { BarChart2, CreditCard } from "lucide-react";
import Link from "next/link";

type Installment = {
  amountPaid: number;
  paymentDate: string;
  dueDate?: string | null;
  modeOfPayment?: string;
};

type Payment = {
  _id: string;
  plan: string;
  actualAmount: number;
  paymentStatus: "Paid" | "Unpaid";
  installments: Installment[];
};

type Member = {
  _id: string;
  name: string;
  mobile: string;
  payments?: Payment[];
};

type PaymentWithMember = {
  _id: string;
  plan: string;
  price: number;
  date: string;
  modeOfPayment: string;
  memberName: string;
  memberId: string;
  memberMobile: string;
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
            (m.payments || []).flatMap((p: Payment) =>
              (p.installments || []).map((inst: Installment) => ({
                _id: p._id,
                plan: p.plan,
                price: inst.amountPaid,
                date: inst.paymentDate,
                modeOfPayment: inst.modeOfPayment || "Cash",
                memberName: m.name,
                memberId: m._id,
                memberMobile: m.mobile,
              }))
            )
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
    <div className="px-3 sm:px-5 lg:px-8 py-4 sm:py-6 bg-[#E9ECEF] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <BarChart2 size={32} className="text-yellow-500" />
        <h1 className="text-2xl sm:text-3xl lg:text-[42px] font-bold text-[#0A2463]">
          Report
        </h1>
      </div>

      {/* Date range + revenue */}
      <div className="flex lg:flex-row flex-wrap gap-4 lg:gap-6 items-stretch mb-6">
        {/* Start Date */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-800">
          <label className="font-semibold text-base sm:text-lg">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 sm:px-4 py-2.5 rounded-xl border border-gray-300 shadow-md
              text-gray-900 text-sm sm:text-lg focus:outline-none focus:ring-2
              focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
              hover:shadow-lg bg-white"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-800">
          <label className="font-semibold text-base sm:text-lg">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 sm:px-4 py-2.5 rounded-xl border border-gray-300 shadow-md
              text-gray-900 text-sm sm:text-lg focus:outline-none focus:ring-2
              focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
              hover:shadow-lg bg-white"
          />
        </div>

        {/* Revenue Card */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow flex items-center gap-3 sm:gap-4 lg:ml-auto w-full sm:w-auto transition-transform transform hover:scale-105">
          <CreditCard size={32} className="text-green-500" />
          <div>
            <p className="text-gray-500 text-sm sm:text-lg">
              Membership Revenue
            </p>
            <p className="text-xl sm:text-2xl font-bold">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Payment history table */}
      <div className="bg-white rounded-2xl shadow p-4 sm:p-6 overflow-x-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Payment History
          </h2>
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by member or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 shadow-md
                text-sm sm:text-base text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2
                focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300
                hover:shadow-lg bg-white"
            />
          </div>
        </div>
        <div className="table-scroll rounded-2xl border border-slate-100">
          <table className="w-full text-xs sm:text-sm lg:text-base">
            <thead className="bg-yellow-500 text-white uppercase text-xs sm:text-sm lg:text-xl">
              <tr>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  Sr.No.
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
                  Date
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  Amount
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left font-semibold">
                  Mode
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-50 divide-y text-xs sm:text-sm lg:text-xl divide-gray-200">
              {filteredPayments.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-6 text-gray-400 text-sm sm:text-base"
                  >
                    No payments found.
                  </td>
                </tr>
              )}

              {filteredPayments.map((p, index) => (
                <tr
                  key={`${p._id}-${index}`}
                  className={`transition-transform transform hover:scale-[1.01] hover:shadow-md ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-medium hover:text-blue-900 cursor-pointer">
                    <Link href={`/members/${p.memberId}`}>{p.memberName}</Link>
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold">
                    {p.memberMobile}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold">
                    {p.plan}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    {new Date(p.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4 font-semibold">
                    ₹{p.price.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 sm:px-6 py-2 sm:py-4">
                    {p.modeOfPayment || "Cash"}
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
