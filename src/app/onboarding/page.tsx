"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Shield, Link as LinkIcon, Lock, Mail, User, Building } from "lucide-react";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [gymName, setGymName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [host, setHost] = useState("yourdomain.com");

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // Get current hostname on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-body">
        Loading access permissions...
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0A0A0A] text-[#F5F5F5] text-center font-body">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 mb-4 shadow-lg shadow-red-500/5">
          <span className="text-red-500 font-bold text-3xl">⚠️</span>
        </div>
        <h1 className="text-3xl font-headline tracking-wider text-red-500 mb-2 uppercase">Access Denied</h1>
        <p className="text-sm text-[#A1A1AA] max-w-sm">
          Only platform Super Administrators are permitted to register new gym portals. Please log in with a Super Admin account to access this page.
        </p>
      </div>
    );
  }

  // Auto-generate slug from gym name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphens
      .replace(/(^-|-$)/g, ""); // strip leading/trailing hyphens
  };

  const handleGymNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGymName(val);
    if (!isSlugEdited) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugEdited(true);
    setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymName, slug, ownerName, email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Something went wrong during registration.");
        setLoading(false);
        return;
      }

      // Successful onboarding - redirect to their tenant dashboard
      router.push(`/${data.slug}/dashboard`);
    } catch (err: any) {
      setError("Failed to connect to server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#0A0A0A] text-[#F5F5F5] font-body w-full">
      <main className="w-full max-w-xl z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-[#F97316]/10 rounded-2xl flex items-center justify-center border border-[#F97316]/20 mb-3 shadow-lg shadow-[#F97316]/5">
            <span className="text-[#F97316] font-bold text-3xl">⚡</span>
          </div>
          <span className="font-headline text-4xl tracking-widest text-[#F97316]">IRON PULSE</span>
          <span className="text-xs uppercase tracking-[0.25em] text-[#A1A1AA] opacity-80 mt-1">Multi-Tenant Gym Network</span>
        </div>

        <div className="glass-card rounded-xl p-8 border-[#2A2A2A] shadow-2xl relative overflow-hidden bg-[#111111] w-full">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" />
          
          <h2 className="text-2xl font-headline tracking-wide text-[#F5F5F5] mb-2 uppercase">Create Your Gym Portal</h2>
          <p className="text-sm text-[#A1A1AA] mb-6">Setup isolated tenant database & branding for your fitness studio.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm mb-6 flex items-center gap-2">
              <Shield size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Gym Name */}
            <div>
              <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-1.5 block">
                Gym / Studio Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B]">
                  <Building size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Iron Pulse Elite"
                  value={gymName}
                  onChange={handleGymNameChange}
                  className="input-dark w-full pl-11 pr-4 py-2.5 rounded-lg text-[#F5F5F5]"
                />
              </div>
            </div>

            {/* Custom URL Slug */}
            <div>
              <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-1.5 block">
                Gym URL Slug
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B]">
                  <LinkIcon size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. iron-pulse-elite"
                  value={slug}
                  onChange={handleSlugChange}
                  className="input-dark w-full pl-11 pr-4 py-2.5 rounded-lg text-[#F5F5F5]"
                />
              </div>
              <p className="text-[11px] text-[#A1A1AA] mt-1.5 font-mono">
                Your gym URL will be: <span className="text-[#F97316] font-semibold">{host}/{slug || "[slug]"}</span>
              </p>
            </div>

            <div className="border-t border-[#2A2A2A] my-6 pt-4" />

            {/* Owner Name */}
            <div>
              <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-1.5 block">
                Owner / Manager Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B]">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="input-dark w-full pl-11 pr-4 py-2.5 rounded-lg text-[#F5F5F5]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-1.5 block">
                Owner Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B]">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@gymdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark w-full pl-11 pr-4 py-2.5 rounded-lg text-[#F5F5F5]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-widest mb-1.5 block">
                Account Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B]">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark w-full pl-11 pr-4 py-2.5 rounded-lg text-[#F5F5F5]"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 rounded-lg font-headline text-lg tracking-wider text-white shadow-lg shadow-orange-500/10 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Registering Gym Portal..." : "🚀 Launch Gym Network Portal"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
