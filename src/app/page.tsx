"use client";

import { useEffect, useState } from "react";
import { User, CreditCard, Calendar, Sliders } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Payment = {
  price: number;
  date: string;
};

type Member = {
  _id: string;
  name: string;
  date: string;
  plan: string;
  mobile: string;
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

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0); // ✅ updated calculation
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const getLatestJoinDate = (member: Member) => {
    if (member.payments && member.payments.length > 0) {
      return new Date(member.payments[member.payments.length - 1].date);
    }
    return new Date(member.date);
  };

  const calculateExpiryDateObj = (joinDate: string, plan: string) => {
    const date = new Date(joinDate);
    const match = plan.match(/(\d+)\s*(day|days|month|months|year|years)/i);

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case "day":
        case "days":
          date.setDate(date.getDate() + value);
          break;
        case "month":
        case "months":
          date.setMonth(date.getMonth() + value);
          break;
        case "year":
        case "years":
          date.setFullYear(date.getFullYear() + value);
          break;
      }
      return date;
    }

    switch (plan.toLowerCase()) {
      case "monthly":
      case "1 month":
      case "1 months":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
      case "3 months":
      case "3 month":
        date.setMonth(date.getMonth() + 3);
        break;
      case "half yearly":
      case "6 months":
      case "6 month":
        date.setMonth(date.getMonth() + 6);
        break;
      case "yearly":
      case "1 year":
      case "12 months":
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date;
  };

  const calculateExpiryDate = (joinDate: string, plan: string) =>
    calculateExpiryDateObj(joinDate, plan).toLocaleDateString("en-GB");

  const today = new Date();

  // Fetch members + total revenue calculation
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        const data = await res.json();
        if (Array.isArray(data.members)) {
          const sortedMembers = data.members.sort((a: Member, b: Member) =>
            a.name.localeCompare(b.name)
          );
          setMembers(sortedMembers);
          setAllMembers(sortedMembers);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };

    const fetchRevenueData = async () => {
      try {
        // Fetch all relevant data
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

        const now = new Date();
        const isCurrentMonth = (dateString: string | Date) => {
          const date = new Date(dateString);
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );
        };

        // Member revenue
        const filteredMembers = (memberData.members || [])
          .map((m: Member) => ({
            ...m,
            payments: m.payments?.filter((p) => isCurrentMonth(p.date)),
          }))
          .filter((m: Member) => m.payments && m.payments.length > 0);

        const totalMemberRevenue = filteredMembers.reduce(
          (acc: number, m: Member) =>
            acc +
            m.payments!.reduce(
              (sum: number, p: Payment) => sum + (p.price || 0),
              0
            ),
          0
        );

        // Coach salaries
        const filteredCoaches = (coachData.coaches || [])
          .map((c: Coach) => ({
            ...c,
            salaryHistory: c.salaryHistory?.filter((s) =>
              isCurrentMonth(s.paidOn)
            ),
          }))
          .filter((c: Coach) => c.salaryHistory && c.salaryHistory.length > 0);

        const totalCoachSalary = filteredCoaches.reduce(
          (acc: number, c: Coach) =>
            acc +
            c.salaryHistory!.reduce(
              (sum: number, s: Salary) => sum + (s.amountPaid || 0),
              0
            ),
          0
        );

        // Miscellaneous
        const totalMisc = (miscData.costs || [])
          .filter((m: MiscCost) => isCurrentMonth(m.date))
          .reduce((acc: number, m: MiscCost) => acc + m.amount, 0);
        // Electricity
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
        const filteredElectricity = (elecData.bills || []).filter(
          (e: ElectricityBill) =>
            monthNames.indexOf(e.month) === now.getMonth() &&
            e.year === now.getFullYear()
        );
        const totalElectricity = filteredElectricity.reduce(
          (acc: number, e: ElectricityBill) => acc + e.amount,
          0
        );
        // Total Revenue
        setTotalRevenue(
          totalMemberRevenue - totalCoachSalary - totalMisc - totalElectricity
        );
      } catch (err) {
        console.error("Failed to fetch revenue data:", err);
      }
    };

    fetchMembers();
    fetchRevenueData();
  }, []);

  const totalMembers = allMembers.length;

  if (status === "loading") {
    return <p className="text-center mt-20 text-gray-700">Loading...</p>;
  }

  if (!session) return null;

  return (
    <div className="p-6 bg-[#E9ECEF] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sliders size={36} className="text-[#FFC107]" />
        <h1 className="text-4xl font-bold text-[#212529]">Admin Panel</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-10">
        {/* Total Members */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/members")}
        >
          <User size={40} className="text-[#FFC107]" />
          <div>
            <p className="text-lg text-[#212529]">Total Members</p>
            <p className="text-2xl font-bold text-[#212529]">{totalMembers}</p>
          </div>
        </div>

        {/* Expiring Soon */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/expiringsoon")}
        >
          <Calendar size={40} className="text-orange-500" />
          <div>
            <p className="text-lg text-[#212529]">Expiring Soon</p>
            <p className="text-2xl font-bold text-[#212529]">
              {
                allMembers.filter((m: Member) => {
                  const expiry = calculateExpiryDateObj(m.date, m.plan);
                  return (
                    expiry >= today &&
                    expiry <=
                      new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                  );
                }).length
              }
            </p>
          </div>
        </div>

        {/* Expired Memberships */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/expiredmembers")}
        >
          <Calendar size={40} className="text-red-500" />
          <div>
            <p className="text-lg text-[#212529]">Expired Memberships</p>
            <p className="text-2xl font-bold text-[#212529]">
              {
                allMembers.filter((m: Member) => {
                  const startDate = getLatestJoinDate(m);
                  const expiry = calculateExpiryDateObj(
                    startDate.toISOString(),
                    m.plan
                  );
                  return expiry < today;
                }).length
              }
            </p>
          </div>
        </div>

        {/* Total Revenue */}
        <div
          className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/revenue")}
        >
          <CreditCard size={40} className="text-green-600" />
          <div>
            <p className="text-lg text-[#212529]">Total Revenue</p>
            <p className="text-2xl font-bold text-[#212529]">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Members Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-[#212529] mb-4">
          Recent Members
        </h2>
        <table className="min-w-full divide-y divide-gray-300 rounded-2xl overflow-hidden">
          <thead className="bg-[#0A2463] text-white">
            <tr>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Date Joined
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold uppercase tracking-wider">
                Expire On
              </th>
            </tr>
          </thead>
          <tbody>
            {members
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .slice(0, 7)
              .map((member: Member, idx: number) => (
                <tr
                  key={member._id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-[#DEE2E6]"
                  } hover:bg-[#FFC107]/20 transition-colors`}
                >
                  <td className="px-6 py-4 font-semibold text-[#212529]">
                    {member.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-[#FFC107]/20 text-[#212529] font-semibold text-base">
                      {member.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#212529]">{member.mobile}</td>
                  <td className="px-6 py-4 text-[#212529]">
                    {new Date(member.date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-6 py-4 text-[#212529] font-semibold">
                    {calculateExpiryDate(member.date, member.plan)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {members.length === 0 && (
          <p className="text-gray-500 mt-4 text-center">No recent members.</p>
        )}
      </div>
    </div>
  );
}
