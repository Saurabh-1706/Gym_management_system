"use client";

import React, { useState, useEffect } from "react";

export default function RegistrationPage() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    plan: "",
    email: "",
    date: "",
  });

  const [status, setStatus] = useState("");
  const [plans, setPlans] = useState<
    { _id: string; name: string; validity: number; amount: number }[]
  >([]);

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        setPlans(data);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      }
    };
    fetchPlans();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");

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
        plan: "",
        email: "",
        date: "",
      });
    } else {
      setStatus("❌ Registration failed.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#1a1a3b] via-[#2a2a5b] to-gray-200 p-10 m-0">
      {/* Title */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-yellow-400 tracking-wider uppercase">
          Become a Member
        </h2>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mt-2 leading-snug">
          Register Now
        </h1>
        <p className="text-gray-200 mt-3">
          Join today & unlock exclusive benefits 🚀
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl p-10 max-w-4xl mx-auto hover:shadow-yellow-100/40 transition duration-500">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          onSubmit={handleSubmit}
        >
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-200">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-5 py-3 text-lg rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition hover:shadow-md"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Date of Join
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className={`w-full px-5 py-3 text-lg rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition hover:shadow-md
                ${form.date === "" ? "text-gray-400" : "text-gray-900"}`}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full px-5 py-3 text-lg rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition hover:shadow-md"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Contact No.
            </label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full px-5 py-3 text-lg rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition hover:shadow-md"
            />
          </div>

          {/* Plan */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              Select Plan
            </label>
            <select
              name="plan"
              value={form.plan}
              onChange={handleChange}
              required
              className={`w-full px-5 py-3 text-lg bg-gray-100 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none transition hover:shadow-md
     ${form.plan === "" ? "text-gray-400" : "text-gray-900"}`}
            >
              {/* Placeholder only visible when no value is selected */}
              {form.plan === "" && (
                <option value="" disabled hidden>
                  Choose a membership plan
                </option>
              )}

              {plans
                .sort((a, b) => a.validity - b.validity) // sort ascending by validity
                .map((p) => (
                  <option key={p._id} value={p.name} className="text-gray-900">
                    {p.name} - ₹{p.amount}
                  </option>
                ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end mt-8 gap-6">
            <button
              type="submit"
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-lg px-10 py-3 rounded-xl font-bold shadow-md hover:shadow-yellow-400/60 hover:scale-105 transform transition"
            >
              🚀 Avail Membership
            </button>
            <button
              type="button"
              onClick={() =>
                setForm({ name: "", mobile: "", plan: "", email: "", date: "" })
              }
              className="bg-gray-700 text-white text-lg px-10 py-3 rounded-xl font-semibold hover:bg-gray-600 transition"
            >
              ❌ Cancel
            </button>
          </div>
        </form>

        {/* Status */}
        {status && (
          <p className="text-center mt-6 font-medium text-gray-200 animate-pulse">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
