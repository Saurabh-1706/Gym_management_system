"use client";

import { useEffect, useState } from "react";
import { BarChart2, CreditCard } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  const { tenantSlug } = useParams();
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
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body text-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
          <BarChart2 size={24} />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] uppercase">
          Sales Report
        </h1>
      </div>

      {/* Date range + revenue */}
      <div className="flex lg:flex-row flex-wrap gap-4 lg:gap-6 items-stretch mb-6">
        {/* Start Date */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[#e5e2e1]">
          <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest block ml-1 whitespace-nowrap">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-dark px-3 sm:px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-[#e5e2e1]">
          <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest block ml-1 whitespace-nowrap">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-dark px-3 sm:px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
          />
        </div>

        {/* Revenue Card */}
        <div className="lg:ml-auto w-full sm:w-auto glass-card border-[#2A2A2A] px-5 py-4 rounded-xl flex items-center gap-3 sm:gap-4 transition-transform hover:scale-[1.02] shadow-lg text-left">
          <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
            <CreditCard size={24} className="text-[#22c55e]" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">
              Membership Revenue
            </p>
            <p className="text-2xl font-headline tracking-wider text-[#e5e2e1]">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Payment history table */}
      <div className="glass-card border-[#2A2A2A] p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] uppercase">
            Payment History
          </h2>
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by member or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark w-full pl-10 pr-4 py-2.5 rounded-lg text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="rounded-xl border-[#2A2A2A] overflow-hidden bg-[#0A0A0A]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead className="table-thead">
                <tr>
                  <th className="px-5 py-3.5">Sr.No.</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Mobile</th>
                  <th className="px-5 py-3.5">Plan</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {filteredPayments.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-zinc-500 text-sm sm:text-base font-medium uppercase tracking-wider"
                    >
                      No payments found.
                    </td>
                  </tr>
                )}

                {filteredPayments.map((p, index) => (
                  <tr
                    key={`${p._id}-${index}`}
                    className="hover:bg-white/5 transition"
                  >
                    <td className="px-5 py-3.5 text-zinc-500 font-medium">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-blue-450 hover:text-blue-400 cursor-pointer">
                      <Link href={`/${tenantSlug}/members/${p.memberId}`}>{p.memberName}</Link>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 font-semibold">
                      {p.memberMobile}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-455 font-semibold">
                      {p.plan}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      {new Date(p.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-[#f97316]">
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      {p.modeOfPayment || "Cash"}
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
