"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Building, Shield, LogOut, PlusCircle, Search, ToggleLeft, ToggleRight, Settings2, ShieldAlert } from "lucide-react";
import Loader from "@/components/Loader";

type Tenant = {
  _id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  plan: "free" | "pro" | "enterprise";
  isActive: boolean;
  createdAt: string;
  planLimits: { maxMembers: number; maxStaff: number };
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Enforce super admin authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Fetch all tenants
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "super_admin") {
      fetchTenants();
    }
  }, [status, session]);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/super-admin/tenants");
      const data = await res.json();
      if (res.ok && data.success) {
        setTenants(data.tenants);
      }
    } catch (err) {
      console.error("Failed to load tenants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    setProcessingId(tenantId);
    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tenantId, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTenants((prev) =>
          prev.map((t) => (t._id === tenantId ? { ...t, isActive: !currentStatus } : t))
        );
        showFeedback(`Tenant status updated successfully!`);
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleChangePlan = async (tenantId: string, newPlan: "free" | "pro" | "enterprise") => {
    setProcessingId(tenantId);
    let maxMembers = 100;
    let maxStaff = 5;
    if (newPlan === "pro") {
      maxMembers = 500;
      maxStaff = 15;
    } else if (newPlan === "enterprise") {
      maxMembers = 10000;
      maxStaff = 100;
    }

    try {
      const res = await fetch("/api/super-admin/tenants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tenantId,
          plan: newPlan,
          planLimits: { maxMembers, maxStaff },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTenants((prev) =>
          prev.map((t) => (t._id === tenantId ? { ...t, plan: newPlan, planLimits: { maxMembers, maxStaff } } : t))
        );
        showFeedback(`Plan tier upgraded to ${newPlan.toUpperCase()}!`);
      }
    } catch (err) {
      console.error("Plan update error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  if (status === "loading" || loading) {
    return <Loader />;
  }

  if (session?.user?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0A0A0A] text-[#F5F5F5] text-center font-body">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h1 className="text-3xl font-headline tracking-wider text-red-500 mb-2 uppercase">Access Denied</h1>
        <p className="text-sm text-[#A1A1AA] max-w-sm">
          Only platform Super Administrators are permitted to access this panel.
        </p>
      </div>
    );
  }

  // Filter tenants
  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalGyms = tenants.length;
  const activeGyms = tenants.filter((t) => t.isActive).length;
  const premiumGyms = tenants.filter((t) => t.plan !== "free").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-body w-full">
      {/* Top Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#111111]/80 backdrop-blur-md border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F97316]/10 rounded-xl flex items-center justify-center border border-[#F97316]/20">
            <span className="text-[#F97316] font-bold text-xl">⚡</span>
          </div>
          <div>
            <h1 className="font-headline text-2xl tracking-widest text-[#F97316]">IRON PULSE</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#A1A1AA]">SaaS Control Center</span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/auth" })}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-all"
        >
          <LogOut size={16} />
          <span>LOGOUT</span>
        </button>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* Banner */}
        <div className="relative rounded-2xl overflow-hidden p-8 bg-gradient-to-br from-[#1A1A1A] to-[#111111] border border-[#2A2A2A] shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute inset-0 bg-radial-gradient from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#F97316]">
              <Shield size={18} />
              <span className="text-xs uppercase tracking-[0.25em] font-semibold">Platform Administrator</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-headline tracking-wide uppercase text-white">SaaS Tenants Dashboard</h2>
            <p className="text-sm text-[#A1A1AA] mt-1 max-w-xl">
              Monitor gym portals, manage pricing plans, configure resource limits, and activate/deactivate accounts in real-time.
            </p>
          </div>
          <button
            onClick={() => router.push("/onboarding")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F97316] hover:bg-[#ff8c3a] text-white font-headline text-lg tracking-wider rounded-lg transition-all shadow-lg shadow-orange-500/10 active:scale-98"
          >
            <PlusCircle size={20} />
            <span>ADD NEW GYM</span>
          </button>
        </div>

        {/* Feedback Alert Popup */}
        {feedbackMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-sm shadow-md animate-fade-in flex items-center gap-2">
            <span>🎉</span>
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6 border-[#2A2A2A] bg-[#111111] relative overflow-hidden">
            <div className="absolute top-4 right-4 text-zinc-700">
              <Building size={40} />
            </div>
            <span className="text-xs uppercase tracking-widest text-[#A1A1AA] block mb-2 font-medium">Total Portals</span>
            <span className="text-4xl font-headline text-white">{totalGyms}</span>
          </div>

          <div className="glass-card rounded-xl p-6 border-[#2A2A2A] bg-[#111111] relative overflow-hidden">
            <div className="absolute top-4 right-4 text-emerald-900/40">
              <Shield size={40} className="text-emerald-500/30" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[#A1A1AA] block mb-2 font-medium">Active Tenants</span>
            <span className="text-4xl font-headline text-emerald-400">{activeGyms}</span>
          </div>

          <div className="glass-card rounded-xl p-6 border-[#2A2A2A] bg-[#111111] relative overflow-hidden">
            <div className="absolute top-4 right-4 text-amber-900/40">
              <Settings2 size={40} className="text-amber-500/30" />
            </div>
            <span className="text-xs uppercase tracking-widest text-[#A1A1AA] block mb-2 font-medium">Paid Subscriptions</span>
            <span className="text-4xl font-headline text-amber-400">{premiumGyms}</span>
          </div>
        </div>

        {/* Table & Filtering */}
        <div className="glass-card rounded-xl border-[#2A2A2A] bg-[#111111] p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-headline text-2xl uppercase tracking-wide text-white">Registered Gym Networks</h3>
            
            {/* Search */}
            <div className="relative max-w-sm w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B]">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search by gym name, email, or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-dark w-full pl-10 pr-4 py-2 text-sm rounded-lg"
              />
            </div>
          </div>

          {/* Tenants Table */}
          <div className="table-scroll rounded-xl border border-[#2A2A2A]/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="table-thead">
                <tr>
                  <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider">Gym Name</th>
                  <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider">Domain / URL</th>
                  <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider">Owner Contact</th>
                  <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider">Active Plan</th>
                  <th className="px-5 py-3.5 text-center font-bold uppercase tracking-wider">Portal Status</th>
                  <th className="px-5 py-3.5 text-left font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2A2A] text-zinc-300">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#A1A1AA]">
                      No gym portals found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant._id} className="hover:bg-white/5 transition">
                      <td className="px-5 py-4 font-semibold text-white">
                        {tenant.name}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-[#F97316] select-all">
                        /{tenant.slug}
                      </td>
                      <td className="px-5 py-4 text-zinc-400">
                        {tenant.ownerEmail}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            tenant.plan === "enterprise"
                              ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                              : tenant.plan === "pro"
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                              : "bg-zinc-500/10 border border-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          disabled={processingId !== null}
                          onClick={() => handleToggleStatus(tenant._id, tenant.isActive)}
                          className="hover:scale-105 active:scale-95 transition-all text-center inline-block cursor-pointer disabled:opacity-50"
                        >
                          {tenant.isActive ? (
                            <ToggleRight size={32} className="text-[#22c55e] inline" />
                          ) : (
                            <ToggleLeft size={32} className="text-zinc-600 inline" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={processingId !== null}
                            onClick={() => handleChangePlan(tenant._id, "free")}
                            className={`px-2 py-1 text-[10px] font-bold rounded border ${
                              tenant.plan === "free"
                                ? "bg-zinc-500/10 border-zinc-500/40 text-zinc-400 cursor-default"
                                : "bg-white/5 border-[#2A2A2A] hover:bg-white/10 text-zinc-300 cursor-pointer"
                            }`}
                          >
                            FREE
                          </button>
                          <button
                            disabled={processingId !== null}
                            onClick={() => handleChangePlan(tenant._id, "pro")}
                            className={`px-2 py-1 text-[10px] font-bold rounded border ${
                              tenant.plan === "pro"
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 cursor-default"
                                : "bg-white/5 border-[#2A2A2A] hover:bg-amber-500/20 hover:text-amber-400 text-zinc-300 cursor-pointer"
                            }`}
                          >
                            PRO
                          </button>
                          <button
                            disabled={processingId !== null}
                            onClick={() => handleChangePlan(tenant._id, "enterprise")}
                            className={`px-2 py-1 text-[10px] font-bold rounded border ${
                              tenant.plan === "enterprise"
                                ? "bg-purple-500/10 border-purple-500/40 text-purple-400 cursor-default"
                                : "bg-white/5 border-[#2A2A2A] hover:bg-purple-500/20 hover:text-purple-400 text-zinc-300 cursor-pointer"
                            }`}
                          >
                            ENT
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
