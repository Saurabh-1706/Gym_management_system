"use client";

import { useEffect, useState } from "react";
import { User, CreditCard, Calendar, DollarSign, Settings, Sliders } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Member = {
  _id: string;
  name: string;
  date: string;
  plan: string;
  mobile: string;
  price?: string;
};

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]); // recent 5 members
  const [allMembers, setAllMembers] = useState<Member[]>([]); // all members for metrics
  const router = useRouter();

  // Function to calculate expiry date
  const calculateExpiryDateObj = (joinDate: string, plan: string) => {
    const date = new Date(joinDate);
    switch (plan.toLowerCase()) {
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + 3);
        break;
      case "half yearly":
        date.setMonth(date.getMonth() + 6);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    return date;
  };

  const calculateExpiryDate = (joinDate: string, plan: string) =>
    calculateExpiryDateObj(joinDate, plan).toLocaleDateString("en-GB");

  const today = new Date();

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("Failed to fetch members");

        const data: Member[] = await res.json();

        // Sort by _id timestamp for recent members (newest first)
        const sortedById = data.sort(
          (a, b) =>
            parseInt(b._id.substring(0, 8), 16) -
            parseInt(a._id.substring(0, 8), 16)
        );

        setMembers(sortedById.slice(0, 5)); // recent 5
        setAllMembers(data); // all members for metrics
      } catch (err) {
        console.error(err);
        setMembers([]);
        setAllMembers([]);
      }
    };

    fetchMembers();
  }, []);

  // Metrics
  const totalMembers = allMembers.length;
  const totalRevenue = allMembers.reduce(
    (acc, m) => acc + (m.price ? parseInt(m.price) : 0),
    0
  );

  // Active plans = members whose membership hasn't expired
  const activePlansCount = allMembers.filter(
    (m) => calculateExpiryDateObj(m.date, m.plan) >= today
  ).length;

  // Expiring soon = memberships expiring within 7 days
  const expiringSoonCount = allMembers.filter((m) => {
    const expiry = calculateExpiryDateObj(m.date, m.plan);
    const diffDays =
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  return (
    <div className="p-6">
      {/*Header */}
      <div className="flex items-center gap-3 mb-6">
        <Sliders size={36} className="text-yellow-500" />
        <h1 className="text-4xl font-bold text-yellow-500">Admin Panel</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-10">
        <div className="bg-white p-6 rounded-2xl shadow flex items-center gap-4"
          onClick={() => router.push("/members")}
        >
          <User size={40} className="text-yellow-500" />
          <div>
            <p className="text-lg text-gray-700">Total Members</p>
            <p className="text-2xl font-bold">{totalMembers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow flex items-center gap-4"
          onClick={() => router.push("/members")}
        >
          <CreditCard size={40} className="text-green-500" />
          <div>
            <p className="text-lg text-gray-700">Active Plans</p>
            <p className="text-2xl font-bold">{activePlansCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
          onClick={() => router.push("/expiringsoon")}
        >
          <Calendar size={40} className="text-orange-500" />
          <div>
            <p className="text-lg text-gray-700">Expiring Soon</p>
              <p className="text-2xl font-bold hover:text-orange-600 transition">
                {
                  allMembers.filter((m) => {
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
            <p className="text-lg text-gray-700">Expired Memberships</p>
            <p className="text-2xl font-bold">
              {
                allMembers.filter((m) => {
                  const expiry = calculateExpiryDateObj(m.date, m.plan);
                  return expiry < today; // expired
                }).length
              }
            </p>
          </div>
        </div>
      </div>

      {/* Recent Members Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-yellow-500 mb-4">
          Recent Members
        </h2>
        <table className="min-w-full divide-y divide-gray-200 rounded-2xl overflow-hidden">
          <thead className="bg-gradient-to-r from-pink-500 to-purple-500">
            <tr>
              <th className="px-6 py-4 text-left text-base font-semibold text-white uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-white uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-white uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-white uppercase tracking-wider">
                Date Joined
              </th>
              <th className="px-6 py-4 text-left text-base font-semibold text-white uppercase tracking-wider">
                Expire On
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-lg">
            {members.map((member, idx) => (
              <tr
                key={member._id}
                className={`${
                  idx % 2 === 0 ? "bg-pink-50" : "bg-purple-50"
                } hover:bg-yellow-50 transition-colors duration-300`}
              >
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {member.name}
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold text-base">
                    {member.plan}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">{member.mobile}</td>
                <td className="px-6 py-4 text-gray-700">
                  {new Date(member.date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-6 py-4 text-gray-700 font-semibold">
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
