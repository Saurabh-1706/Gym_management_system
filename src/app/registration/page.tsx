"use client";

import React, { useState } from "react";

export default function RegistrationPage() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    date: "",
    dob: "",
  });

  const [errors, setErrors] = useState<{ email?: string; mobile?: string }>({});
  const [status, setStatus] = useState("");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: emailRegex.test(value) ? "" : "Invalid email format",
      }));
    }

    if (name === "mobile") {
      setErrors((prev) => ({
        ...prev,
        mobile: mobileRegex.test(value)
          ? ""
          : "Mobile must be 10 digits starting with 6-9",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailRegex.test(form.email)) {
      setErrors((prev) => ({ ...prev, email: "Invalid email format" }));
      return;
    }
    if (!mobileRegex.test(form.mobile)) {
      setErrors((prev) => ({
        ...prev,
        mobile: "Mobile must be 10 digits starting with 6-9",
      }));
      return;
    }

    setStatus("Submitting...");

    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      if (result.success) {
        setStatus("✅ Member registered successfully!");
        setForm({
          name: "",
          mobile: "",
          email: "",
          date: "",
          dob: "",
        });
      } else {
        setStatus(`❌ ${result.error || "Registration failed."}`);
      }
    } catch {
      setStatus("❌ Registration failed.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E9ECEF] p-10">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-[#212529] tracking-wider uppercase">
          Become a Member
        </h2>
        <h1 className="text-5xl font-extrabold text-[#0A2463] mt-2 leading-snug">
          Register Now
        </h1>
        <p className="text-[#212529] mt-3">
          Join today & unlock exclusive benefits 🚀
        </p>
      </div>

      <div className="bg-white rounded-3xl p-10 max-w-4xl mx-auto shadow-lg hover:shadow-xl transition duration-500">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          onSubmit={handleSubmit}
        >
          {/* Full Name */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] 
                         focus:ring-2 focus:ring-[#0A2463] focus:outline-none"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] 
                         focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
              required
            />
          </div>

          {/* Join Date */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Date of Join
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] 
                         focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] 
                         focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Mobile */}
          <div className="md:col-span-2">
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Contact No.
            </label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="w-98 px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] 
                         focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
              required
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end mt-8 gap-6">
            <button
              type="submit"
              className="bg-[#0A2463] text-white text-lg px-10 py-3 rounded-xl font-bold 
                         shadow-md hover:shadow-lg hover:scale-105 transform transition"
            >
              🚀 Register
            </button>
            <button
              type="button"
              onClick={() =>
                setForm({
                  name: "",
                  mobile: "",
                  email: "",
                  date: "",
                  dob: "",
                })
              }
              className="bg-[#ADB5BD] text-[#212529] text-lg px-10 py-3 rounded-xl 
                         font-semibold hover:bg-gray-400 transition"
            >
              ❌ Cancel
            </button>
          </div>
        </form>

        {status && (
          <p className="text-center mt-6 font-medium text-[#FFC107] animate-pulse">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
