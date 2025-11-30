"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

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

    if (res?.ok) router.push("/");
    else alert(res?.error || "Invalid credentials");

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Left side - Logo / Branding (only on large screens) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-b from-[#0A2463] to-[#1A3B8F] items-center justify-center relative">
        <div className="flex flex-col items-center text-center px-6">
          <img
            src="/logo-removebg-preview.png"
            alt="Mojad Fitness Logo"
            className="max-w-xs lg:max-w-sm object-contain animate-fadeIn"
          />
          <div className="mt-8 text-white">
            <h2 className="text-3xl font-semibold tracking-wide">
              Mojad Fitness
            </h2>
            <p className="mt-2 text-base opacity-80 max-w-md">
              Empowering your fitness journey every day.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-8 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl bg-white shadow-xl px-5 py-6 sm:px-8 sm:py-8 space-y-6"
        >
          {/* Mobile logo / title */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <img
                src="/logo-removebg-preview.png"
                alt="Mojad Fitness Logo"
                className="h-10 w-auto object-contain lg:hidden"
              />
              <span className="text-lg font-semibold text-[#0A2463] lg:hidden">
                Mojad Fitness
              </span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0A2463]">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-500">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 px-3 py-2.5 rounded-xl w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-[#0A2463] transition"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 px-3 py-2.5 pr-11 rounded-xl w-full text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#0A2463] focus:border-[#0A2463] transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 py-2.5 sm:py-3 rounded-xl font-semibold text-white text-sm sm:text-base transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#0A2463] hover:bg-[#0F3C78] shadow-md hover:shadow-lg"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
