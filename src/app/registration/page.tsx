"use client";

import React, { useState, useEffect } from "react";

export default function RegistrationPage() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    plan: "",
    date: "",
    dob: "", // ✅ new field
    price: "",
    validity: "",
    customValidity: "",
    customValidityUnit: "days",
    modeOfPayment: "",
  });

  const [errors, setErrors] = useState<{ email?: string; mobile?: string }>({});
  const [status, setStatus] = useState("");
  const [plans, setPlans] = useState<
    { _id: string; name: string; validity: number; amount: number }[]
  >([]);
  const [useDefaultPrice, setUseDefaultPrice] = useState(true);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^[6-9]\d{9}$/;

  // Fetch plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        const data = await res.json();
        if (Array.isArray(data.plans)) {
          setPlans(data.plans);
        } else {
          setPlans([]);
        }
      } catch {
        setPlans([]);
      }
    };
    fetchPlans();
  }, []);

  // Auto-set default price when plan changes
  useEffect(() => {
    if (form.plan && useDefaultPrice && form.plan !== "custom") {
      const selectedPlan = plans.find((p) => p.name === form.plan);
      if (selectedPlan) {
        setForm((prev) => ({ ...prev, price: selectedPlan.amount.toString() }));
      }
    }
  }, [form.plan, useDefaultPrice, plans]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUseDefaultPrice(e.target.checked);
    if (e.target.checked && form.plan !== "custom") {
      const selectedPlan = plans.find((p) => p.name === form.plan);
      if (selectedPlan) {
        setForm((prev) => ({ ...prev, price: selectedPlan.amount.toString() }));
      }
    } else if (form.plan !== "custom") {
      setForm((prev) => ({ ...prev, price: "" }));
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

    let payload: any = {
      name: form.name,
      mobile: form.mobile,
      email: form.email,
      date: form.date,
      dob: form.dob, // ✅ send DOB
      plan: form.plan,
      price: form.price,
      modeOfPayment: form.modeOfPayment,
    };

    if (form.plan === "custom") {
      payload.plan = "custom";
      payload.customValidity = form.customValidity;
      payload.customUnit = form.customValidityUnit;
    }

    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setStatus("✅ Member registered successfully!");
        setForm({
          name: "",
          mobile: "",
          email: "",
          plan: "",
          date: "",
          dob: "",
          price: "",
          validity: "",
          customValidity: "",
          customValidityUnit: "days",
          modeOfPayment: "",
        });
        setUseDefaultPrice(true);
      } else {
        // Show duplicate or generic error
        setStatus(`❌ ${result.error || "Registration failed."}`);
      }
    } catch {
      setStatus("❌ Registration failed.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E9ECEF] p-10 m-0">
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
          {/* Name */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Full Name
            </label>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none"
              required
            />
          </div>

          {/* Date of Birth ✅ */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Date of Birth
            </label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
              required
            />
          </div>

          {/* Date of Join */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Date of Join
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
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
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-lg font-semibold mb-2 text-[#212529]">
              Contact No.
            </label>
            <input
              type="tel"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter your phone number"
              className="w-full px-5 py-3 text-lg rounded-xl border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none text-[#212529]"
              required
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Plan + Mode of Payment */}
          <div className="md:col-span-2 flex gap-8">
            {/* Choose Plan */}
            <div className="flex-1">
              <label className="block text-lg font-semibold mb-2 text-[#212529]">
                Select Plan
              </label>
              <select
                name="plan"
                value={form.plan}
                onChange={handleChange}
                className={`w-full px-5 py-3 text-lg bg-white border border-[#ADB5BD] rounded-xl focus:ring-2 focus:ring-[#0A2463] focus:outline-none transition hover:shadow-md ${
                  form.plan === "" ? "text-gray-400" : "text-[#212529]"
                }`}
              >
                <option value="" disabled hidden>
                  Choose a membership plan
                </option>
                {plans
                  .sort((a, b) => a.validity - b.validity)
                  .map((p) => (
                    <option
                      key={p._id}
                      value={p.name}
                      className="text-[#212529]"
                    >
                      {p.name}
                    </option>
                  ))}
                <option value="custom" className="text-[#212529]">
                  Custom Plan
                </option>
              </select>
            </div>

            {/* Mode of Payment */}
            <div className="flex-1">
              <label className="block text-lg font-semibold mb-2 text-[#212529]">
                Mode of Payment
              </label>
              <select
                name="modeOfPayment"
                value={form.modeOfPayment || ""}
                onChange={handleChange}
                className={`w-full px-3 py-3 text-lg bg-white border border-[#ADB5BD] rounded-xl focus:ring-2 focus:ring-[#0A2463] focus:outline-none transition hover:shadow-md ${
                  form.modeOfPayment ? "text-gray-800" : "text-gray-400"
                }`}
              >
                <option value="" disabled hidden>
                  Choose Mode of Payment
                </option>
                <option value="Cash" className="text-gray-800">
                  Cash
                </option>
                <option value="UPI" className="text-gray-800">
                  UPI
                </option>
              </select>
            </div>
          </div>

          {/* Custom Plan Fields */}
          {form.plan === "custom" && (
            <>
              {/* Custom Validity */}
              <div>
                <label className="block text-lg font-semibold mb-2 text-[#212529]">
                  Validity
                </label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    name="customValidity"
                    value={form.customValidity || ""}
                    onChange={handleChange}
                    placeholder="Enter Validity"
                    className="w-2/3 px-5 py-3 text-lg rounded-xl bg-white border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none transition hover:shadow-md text-[#212529]"
                  />
                  <select
                    name="customValidityUnit"
                    value={form.customValidityUnit || "days"}
                    onChange={handleChange}
                    className="w-1/3 px-3 py-3 text-lg rounded-xl bg-white border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none transition hover:shadow-md text-[#212529]"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>

              {/* Custom Price */}
              <div>
                <label className="block text-lg font-semibold mb-2 text-[#212529]">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Enter price"
                  className="w-full px-5 py-3 text-lg rounded-xl bg-white border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none transition hover:shadow-md text-[#212529]"
                  required
                />
              </div>
            </>
          )}

          {/* Default price checkbox and optional custom price for non-custom plans */}
          {form.plan !== "custom" && (
            <>
              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={useDefaultPrice}
                  onChange={handleCheckboxChange}
                  id="defaultPrice"
                  className="w-5 h-5 accent-green-600"
                />
                <label
                  htmlFor="defaultPrice"
                  className="text-[#212925] text-lg font-medium"
                >
                  Continue with fixed price (₹{form.price})
                </label>
              </div>

              {/* Show new price input if unchecked */}
              {!useDefaultPrice && (
                <div className="md:col-span-2">
                  <label className="block text-lg font-semibold mb-2 text-[#212529]">
                    Enter New Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="Enter Price"
                    className="w-full px-5 py-3 text-lg rounded-xl bg-white border border-[#ADB5BD] focus:ring-2 focus:ring-[#0A2463] focus:outline-none transition hover:shadow-md text-[#212529]"
                    required
                  />
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end mt-8 gap-6">
            <button
              type="submit"
              className="bg-[#0A2463] text-white text-lg px-10 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-105 transform transition"
            >
              🚀 Avail Membership
            </button>
            <button
              type="button"
              onClick={() =>
                setForm({
                  name: "",
                  mobile: "",
                  plan: "",
                  email: "",
                  date: "",
                  dob: "",
                  price: "",
                  validity: "",
                  customValidity: "",
                  customValidityUnit: "days",
                  modeOfPayment: "",
                })
              }
              className="bg-[#ADB5BD] text-[#212529] text-lg px-10 py-3 rounded-xl font-semibold hover:bg-gray-400 transition"
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
