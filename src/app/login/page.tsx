"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Half - Logo / Branding */}
      <div className="w-1/2 flex items-center justify-center bg-gradient-to-b from-[#1a1a3b] via-[#2a2a5b] to-gray-200">
        <div className="text-center text-white px-6">
          <img
            src="/gym-logo.png"
            alt="Gym Logo"
            className="mx-auto mb-6 w-40 h-40 drop-shadow-lg animate-pulse"
          />
          <h1 className="text-5xl font-extrabold">Your Gym Name</h1>
          <p className="mt-2 text-lg opacity-90">Get fit. Stay strong 🚀</p>
        </div>
      </div>

      {/* Right Half - Modern Login Form */}
      <div className="w-1/2 flex items-center justify-center bg-gradient-to-b from-[#1a1a3b] via-[#2a2a5b] to-gray-200">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 max-w-md w-3/4 mx-auto shadow-xl hover:shadow-yellow-300/40 transition duration-500">
          {/* Title */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-400 tracking-wider uppercase">
              Welcome Back
            </h2>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mt-2 leading-snug">
              Sign In
            </h1>
            <p className="text-gray-200 mt-3">Access your Gym App instantly</p>
          </div>

          {/* Email Input */}
          <form className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-200">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                placeholder="example@email.com"
                className="w-full px-5 py-3 text-lg rounded-xl bg-white/20 border border-white/30 placeholder-gray-300 text-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition hover:shadow-lg hover:scale-[1.02]"
              />
            </div>

            {/* Social Login Button */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:scale-105 transform transition duration-300"
              >
               Sign in with Google
              </button>
            </div>

            {/* Optional divider for email/password */}
            {/* <div className="flex items-center justify-center text-gray-200 my-2">
              <span className="border-b border-gray-400 w-1/4"></span>
              <span className="mx-2 text-sm">or</span>
              <span className="border-b border-gray-400 w-1/4"></span>
            </div> */}
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{" "}
              <a href="/registration" className="text-yellow-400 font-semibold hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
