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
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"success" | "error">("success");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "email") {
      setErrors((prev) => ({
        ...prev,
        email: value && !emailRegex.test(value) ? "Invalid email format" : "",
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

    if (form.email && !emailRegex.test(form.email)) {
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

    try {
      const parseToUTCDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      };

      const joinDate = form.date ? parseToUTCDate(form.date) : new Date();
      const dobDate = form.dob ? parseToUTCDate(form.dob) : new Date();

      const payload = {
        ...form,
        date: joinDate.toISOString(),
        dob: dobDate.toISOString(),
      };

      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setModalType("success");
        setModalMessage("✅ Member registered successfully!");
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        setForm({
          name: "",
          mobile: "",
          email: "",
          date: "",
          dob: "",
        });
      } else {
        setModalType("error");
        setModalMessage(
          result.message ||
            "❌ Member with same mobile number and date of birth already exists."
        );
        setShowModal(true);
        setTimeout(() => setShowModal(false), 4000);
      }
    } catch (err) {
      console.error(err);
      setModalType("error");
      setModalMessage("❌ Registration failed. Please try again.");
      setShowModal(true);
      setTimeout(() => setShowModal(false), 4000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0F0F0F] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 lg:py-10 relative flex flex-col font-body">
      {/* Heading */}
      <div className="mb-6 text-center">
        <h2 className="text-base sm:text-lg font-headline tracking-widest text-[#f97316] uppercase">
          Become a Member
        </h2>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-white mt-2 leading-snug">
          Register Now
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mt-2">
          Join today & unlock exclusive benefits 🚀
        </p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-xl p-6 sm:p-8 lg:p-10 max-w-4xl w-full mx-auto shadow-lg border-[#2A2A2A]">
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
          onSubmit={handleSubmit}
        >
          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
              required
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
              required
            />
          </div>

          {/* Join Date */}
          <div>
            <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
              Date of Registration
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
            />
            {errors.email && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          {/* Mobile */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
              Contact No.
            </label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
              required
            />
            {errors.mobile && (
              <p className="text-red-400 text-xs sm:text-sm mt-1">
                {errors.mobile}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex flex-col sm:flex-row justify-end mt-4 sm:mt-6 gap-3 sm:gap-6">
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto px-6 sm:px-10 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
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
              className="btn-secondary w-full sm:w-auto px-6 sm:px-10 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Popup Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className={`p-6 sm:p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 border transition-all ${
              modalType === "success"
                ? "bg-green-950/20 text-[#22c55e] border-[#22c55e]/25 backdrop-blur-md"
                : "bg-red-950/20 text-red-400 border border-red-500/25 backdrop-blur-md"
            }`}
          >
            <h2 className="text-2xl sm:text-3xl font-headline tracking-wider mb-3">
              {modalType === "success" ? "✅ Success!" : "⚠️ Error!"}
            </h2>
            <p className="text-sm sm:text-lg mb-6">
              {modalMessage}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="btn-primary px-6 py-2 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
