"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      window.location.href = "/";
    } else {
      alert(res?.error || "Invalid credentials");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#0F0F0F] text-[#e5e2e1] font-body w-full">
      <main className="w-full max-w-md z-10">
        {/* Brand Header Section */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-6 relative">
            {/* Gym Logo Container */}
            <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <span className="text-[#f97316] text-5xl font-headline select-none">⚡</span>
            </div>
            {/* Decorative Glow behind logo */}
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full -z-10 opacity-30"></div>
          </div>
          <h1 className="font-headline text-4xl tracking-widest text-[#e5e2e1] mb-2">WELCOME BACK</h1>
          <p className="font-body text-sm text-[#e0c0b1] opacity-80 max-w-xs mx-auto">
            Enter your credentials to access your performance dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-xl p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input Group */}
            <div className="space-y-2">
              <label className="font-body text-xs font-semibold text-[#e0c0b1] block ml-1 uppercase tracking-widest" htmlFor="email">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#f97316] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="input-dark w-full pl-12 pr-4 py-3.5 rounded-lg text-[#e5e2e1] placeholder:text-zinc-650"
                />
              </div>
            </div>

            {/* Password Input Group */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-body text-xs font-semibold text-[#e0c0b1] block uppercase tracking-widest" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-[#f97316] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-dark w-full pl-12 pr-11 py-3.5 rounded-lg text-[#e5e2e1] placeholder:text-zinc-655"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#e5e2e1] focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 rounded-lg font-headline text-2xl tracking-widest shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </form>
        </div>

        {/* System Status/Contextual info */}
        <div className="mt-8 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-zinc-500">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-pulse neon-glow-secondary"></span>
            <span className="font-body text-[10px] uppercase tracking-wider">System Operational</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-550">
            <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full"></span>
            <span className="font-body text-[10px] uppercase tracking-wider">Secure Access</span>
          </div>
        </div>
      </main>
    </div>
  );
}
