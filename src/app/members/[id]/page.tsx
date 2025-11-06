"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  UserCircle,
  Phone,
  Calendar,
  CreditCard,
  History,
  Mail,
  Edit,
  Trash2,
  RefreshCcw,
  ClockAlert,
  Camera,
} from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import Loader from "@/components/Loader";

type Installment = {
  amountPaid: number;
  paymentDate: string;
  dueDate?: string | null;
  modeOfPayment?: string;
};

type Payment = {
  _id?: string;
  plan: string;
  actualAmount: number;
  installments: Installment[];
  paymentStatus: "Paid" | "Unpaid";
};

type Member = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  dob: string;
  date: string;
  joinDate?: string; // ✅ added this line
  plan: string;
  payments?: Payment[];
  profilePicture?: string;
  status?: "Active" | "Inactive";
  paymentStatus?: "Paid" | "Unpaid";
};

type Plan = {
  _id?: string;
  name: string;
  amount: number;
  validity: number;
  validityType: "months" | "days";
};

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

// Get latest join/payment date
function getLatestJoinDate(member: Member): Date {
  if (member.payments && member.payments.length > 0) {
    const latestPayment = [...member.payments].sort((a, b) => {
      const aDate =
        a.installments?.[a.installments.length - 1]?.paymentDate || 0;
      const bDate =
        b.installments?.[b.installments.length - 1]?.paymentDate || 0;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })[0];

    return new Date(
      latestPayment?.installments?.[latestPayment.installments.length - 1]
        ?.paymentDate || member.date
    );
  }
  return new Date(member.date);
}

// Get latest plan
function getLatestPlan(member: Member): string {
  if (member.payments && member.payments.length > 0) {
    const latestPayment = [...member.payments].sort((a, b) => {
      const aDate =
        a.installments?.[a.installments.length - 1]?.paymentDate || 0;
      const bDate =
        b.installments?.[b.installments.length - 1]?.paymentDate || 0;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })[0];

    return latestPayment.plan;
  }
  return member.plan;
}

export default function MemberProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [member, setMember] = useState<Member | null>(null);
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);

  const [renewPlan, setRenewPlan] = useState("");
  const [renewMode, setRenewMode] = useState("");
  const [renewDate, setRenewDate] = useState("");

  const [renewPaymentStatus, setRenewPaymentStatus] = useState<
    "Paid" | "Unpaid"
  >("Unpaid"); // ✅ default Unpaid

  const [customValidity, setCustomValidity] = useState<number | "">("");
  const [customUnit, setCustomUnit] = useState("days");
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [newProfilePicture, setNewProfilePicture] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // New installment-related states
  const [paymentOption, setPaymentOption] = useState("One Time"); // default
  const [actualAmount, setActualAmount] = useState<number | "">("");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [remainingAmount, setRemainingAmount] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [joinDateInput, setJoinDateInput] = useState("");

  // 💰 Payment modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    paymentId: string;
    remaining: number;
    plan: string;
  } | null>(null);
  const [payMode, setPayMode] = useState("");
  const [payAmount, setPayAmount] = useState<number | "">("");
  // Renewal extra states
  const [useDefaultPrice, setUseDefaultPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [installmentFee, setInstallmentFee] = useState<number | "">("");

  // Feedback modals
  const [showFeedbackModal, setShowFeedbackModal] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (paymentOption === "Installment" && actualAmount && amountPaid) {
      const remain = Number(actualAmount) - Number(amountPaid);
      setRemainingAmount(remain >= 0 ? remain : 0);
    }
  }, [actualAmount, amountPaid, paymentOption]);

  useEffect(() => {
    if (showFeedbackModal) {
      const timer = setTimeout(() => setShowFeedbackModal(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showFeedbackModal]);

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowCropper(true);
    }
  };

  const handleCropComplete = async (croppedBase64: string) => {
    setShowCropper(false);
    setNewProfilePicture(croppedBase64);
    setUploading(true);

    try {
      const res = await fetch(`/api/members/${member?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePicture: croppedBase64 }),
      });

      if (res.ok) {
        const updated = await res.json();
        setMember(updated.member);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } finally {
      setUploading(false);
    }
  };

  const calculateExpiryDate = (member: Member) => {
    const latestPayment =
      member.payments && member.payments.length > 0
        ? [...member.payments].sort(
            (a, b) =>
              new Date(
                b.installments?.[b.installments.length - 1]?.paymentDate || 0
              ).getTime() -
              new Date(
                a.installments?.[a.installments.length - 1]?.paymentDate || 0
              ).getTime()
          )[0]
        : null;

    const planStr = latestPayment?.plan || member.plan;
    const startDate = latestPayment
      ? new Date(latestPayment.installments?.[0]?.paymentDate || member.date)
      : new Date(member.date);

    const expiryDate = new Date(startDate);

    if (!planStr) return expiryDate;

    // ✅ Handle Custom Plans
    const customMatch = planStr.match(
      /Custom\((\d+)\s*(day|days|month|months|year|years)\)/i
    );

    if (customMatch) {
      const value = parseInt(customMatch[1], 10);
      const unit = customMatch[2].toLowerCase();
      switch (unit) {
        case "day":
        case "days":
          expiryDate.setDate(expiryDate.getDate() + value - 1);
          break;
        case "month":
        case "months":
          expiryDate.setMonth(expiryDate.getMonth() + value);
          expiryDate.setDate(expiryDate.getDate() - 1); // ✅ subtract 1 day
          break;
        case "year":
        case "years":
          expiryDate.setFullYear(expiryDate.getFullYear() + value);
          expiryDate.setDate(expiryDate.getDate() - 1); // ✅ subtract 1 day
          break;
      }
      return expiryDate;
    }

    // ✅ Handle Predefined Plans from DB
    const dbPlan = allPlans.find(
      (p) => p.name.toLowerCase() === planStr.toLowerCase()
    );

    if (dbPlan && dbPlan.validity > 0) {
      switch (dbPlan.validityType) {
        case "days":
          expiryDate.setDate(expiryDate.getDate() + dbPlan.validity - 1);
          break;
        case "months":
          expiryDate.setMonth(expiryDate.getMonth() + dbPlan.validity);
          expiryDate.setDate(expiryDate.getDate() - 1); // ✅ end 1 day before same date
          break;
        default:
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          expiryDate.setDate(expiryDate.getDate() - 1); // ✅ fallback fix
      }
      return expiryDate;
    }

    expiryDate.setMonth(expiryDate.getMonth() + 1);
    expiryDate.setDate(expiryDate.getDate() - 1); // ✅ final fallback
    return expiryDate;
  };

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const res = await fetch(`/api/members/${id}`);
        if (!res.ok) throw new Error("Failed to fetch member");
        const data = await res.json();

        const payments = (data.member.payments || []).sort(
          (a: Payment, b: Payment) => {
            const aDate =
              a.installments?.[a.installments.length - 1]?.paymentDate || 0;
            const bDate =
              b.installments?.[b.installments.length - 1]?.paymentDate || 0;
            return new Date(aDate).getTime() - new Date(bDate).getTime();
          }
        );

        const memberObj = { ...data.member, payments };
        setMember(memberObj);
        setMemberData(memberObj);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        if (!res.ok) throw new Error("Failed to fetch plans");
        const data = await res.json();
        setAllPlans(Array.isArray(data.plans) ? data.plans : []);
      } catch (err) {
        console.error(err);
        setAllPlans([]);
      }
    };
    fetchPlans();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E9ECEF]">
        <Loader text="Loading member profile..." />
      </div>
    );

  if (!member)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-xl">
        Member not found ❌
      </div>
    );

  const joinDate = new Date(member.joinDate || member.date);
  const currentPlan = getLatestPlan(member);

  const handleRenew = async () => {
    try {
      let finalPlan = renewPlan;

      if (renewPlan === "Custom") {
        if (!customValidity || !customUnit) {
          setShowFeedbackModal({
            type: "error",
            message: "Enter validity for custom plan.",
          });
          return;
        }
        finalPlan = `Custom(${customValidity} ${customUnit})`;
      }

      if (!finalPlan || !renewMode) {
        setShowFeedbackModal({
          type: "error",
          message: "Please fill all required fields.",
        });
        return;
      }

      // 🔹 Determine base price
      const selectedDbPlan = allPlans.find((p) => p.name === finalPlan);
      const defaultPrice = selectedDbPlan?.amount || 0;
      const planPrice = useDefaultPrice
        ? defaultPrice
        : customPrice
        ? Number(customPrice)
        : defaultPrice;

      const body: any = {
        plan: finalPlan,
        date: renewDate ? new Date(renewDate) : new Date(),
        modeOfPayment: renewMode,
        paymentStatus: renewPaymentStatus,
        joinDate: joinDateInput ? new Date(joinDateInput) : new Date(),
        updateJoinDate: true,
      };

      if (paymentOption === "One Time") {
        body.actualAmount = planPrice;
        body.amountPaid = planPrice;
      } else {
        // 🧩 Compute actual amount correctly
        const selectedDbPlan = allPlans.find((p) => p.name === finalPlan);
        const planBaseAmount = selectedDbPlan?.amount || 0;
        const finalActualAmount = useDefaultPrice
          ? planBaseAmount
          : Number(actualAmount);

        if (!finalActualAmount || finalActualAmount <= 0) {
          setShowFeedbackModal({
            type: "error",
            message: "Enter actual amount for installment.",
          });
          return;
        }

        // Include installment fee
        const totalAmount = finalActualAmount + (Number(installmentFee) || 0);

        body.actualAmount = totalAmount;
        body.amountPaid = Number(amountPaid);
        body.dueDate = dueDate ? new Date(dueDate) : null;
        body.installmentFee = Number(installmentFee) || 0;
      }

      const res = await fetch(`/api/members/${member?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Renewal failed");

      const updated = await res.json();
      const sortedPayments = [...(updated.member.payments || [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMember({ ...updated.member, payments: sortedPayments });
      setShowRenewModal(false);
      setShowFeedbackModal({
        type: "success",
        message: "Membership renewed successfully!",
      });

      // reset all form fields
      setRenewPlan("");
      setRenewMode("");
      setRenewPaymentStatus("Unpaid");
      setCustomValidity("");
      setCustomUnit("days");
      setRenewDate("");
      setPaymentOption("One Time");
      setActualAmount("");
      setAmountPaid("");
      setRemainingAmount("");
      setDueDate("");
      setJoinDateInput("");
      setInstallmentFee("");
    } catch (err) {
      console.error(err);
      setShowFeedbackModal({
        type: "error",
        message: "Renewal failed! Try again.",
      });
    }
  };

  const latestPayment =
    member.payments && member.payments.length > 0
      ? [...member.payments].sort(
          (a, b) =>
            new Date(
              b.installments?.[b.installments.length - 1]?.paymentDate || 0
            ).getTime() -
            new Date(
              a.installments?.[a.installments.length - 1]?.paymentDate || 0
            ).getTime()
        )[0]
      : null;

  const currentPaymentStatus = latestPayment?.paymentStatus || "Unpaid";

  const handlePayRemaining = async (
    paymentId: string,
    remaining: number,
    plan: string
  ) => {
    const payNow = prompt(
      `Enter amount to pay (Remaining: ₹${remaining})`,
      remaining.toString()
    );
    if (!payNow) return;

    const amount = Number(payNow);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter valid amount");
      return;
    }

    const mode = prompt("Enter payment mode (Cash/UPI)", "Cash") || "Cash";

    try {
      const res = await fetch(`/api/members/${member?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          additionalInstallment: {
            amountPaid: amount,
            paymentDate: new Date(),
            modeOfPayment: mode,
          },
        }),
      });

      if (!res.ok) throw new Error("Payment update failed");

      const updated = await res.json();
      setMember(updated.member);
      alert("Payment recorded successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Payment update failed ❌");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#E9ECEF] via-[#F8F9FA] to-white p-10 space-y-10">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <h1 className="flex items-center gap-4 text-5xl font-extrabold text-[#0A2463]">
          <UserCircle size={48} className="text-[#FFC107]" /> Member Profile
        </h1>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-5 py-2 bg-[#0A2463] text-white rounded-lg shadow hover:bg-[#152b7a] transition"
          >
            <Edit size={18} /> Edit
          </button>
          <button
            onClick={() => setShowRenewModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-[#FFC107] text-[#0A2463] font-semibold rounded-lg shadow hover:bg-[#e0a800] transition"
          >
            <RefreshCcw size={18} /> Renew Plan
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Member Card */}
      {!editing && (
        <div className="relative bg-white rounded-3xl p-10 max-w-6xl mx-auto shadow-lg border border-gray-200">
          {member.status === "Inactive" && (
            <span className="absolute top-5 right-5 px-4 py-2 rounded-full bg-red-600 text-white font-semibold shadow-lg">
              Inactive
            </span>
          )}
          {member.status === "Active" && (
            <span className="absolute top-5 right-5 px-4 py-2 rounded-full bg-green-600 text-white font-semibold shadow-lg">
              Active
            </span>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
            {/* Profile */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                {/* Profile Image */}
                {newProfilePicture || member?.profilePicture ? (
                  <img
                    src={newProfilePicture || member?.profilePicture!}
                    alt={member?.name || "Member"}
                    className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-[#FFC107] cursor-pointer"
                    onClick={() => setShowLightbox(true)}
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-[#FFC107] flex items-center justify-center text-white text-5xl font-bold shadow-md">
                    {member?.name ? getInitials(member.name) : "NA"}
                  </div>
                )}

                {/* Camera Icon */}
                <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                  <Camera size={24} className="text-[#0A2463]" />
                </label>

                {/* Upload Status */}
                {uploading && (
                  <span className="absolute bottom-0 left-0 text-sm text-blue-600 font-semibold">
                    Uploading...
                  </span>
                )}
                {uploadSuccess && (
                  <span className="absolute bottom-0 left-0 text-sm text-green-600 font-semibold">
                    Saved ✔
                  </span>
                )}

                {/* Image Cropper */}
                {showCropper && selectedFile && (
                  <ImageCropper
                    file={selectedFile}
                    onComplete={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                  />
                )}
              </div>

              <h2 className="mt-4 text-2xl font-bold text-[#0A2463]">
                {member.name}
              </h2>
            </div>

            {/* Details */}
            <div className="md:col-span-2 space-y-4 text-[#212529] text-[22px]">
              <p className="flex items-center gap-3">
                <Phone size={20} className="text-purple-600" />
                <strong>Mobile:</strong> {member.mobile}
              </p>
              <p className="flex items-center gap-3">
                <Calendar size={20} className="text-pink-600" />
                <strong>Date of Birth:</strong>{" "}
                {new Date(member.dob).toLocaleDateString("en-GB")}
              </p>

              {member.email && (
                <p className="flex items-center gap-3">
                  <Mail size={20} className="text-red-600" />
                  <strong>Email:</strong> {member.email}
                </p>
              )}
              {/* Original Join Date */}
              <p className="flex items-center gap-3">
                <Calendar size={20} className="text-blue-600" />
                <strong>Registration Date:</strong>{" "}
                {member.joinDate
                  ? new Date(member.joinDate).toLocaleDateString("en-GB")
                  : "-"}
              </p>

              {/* Last Renewal Date */}
              <p className="flex items-center gap-3">
                <Calendar size={20} className="text-indigo-600" />
                <strong>Renewal Date:</strong>{" "}
                {member.payments && member.payments.length > 0
                  ? new Date(
                      member.payments[
                        member.payments.length - 1
                      ].installments[0]?.paymentDate
                    ).toLocaleDateString("en-GB")
                  : "-"}
              </p>

              <p className="flex items-center gap-3">
                <CreditCard size={20} className="text-green-600" />
                <strong>Current Plan:</strong> {currentPlan}
                {currentPaymentStatus === "Paid" ? (
                  <span className="ml-3 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border border-green-300">
                    Paid
                  </span>
                ) : (
                  <span className="ml-3 px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-700 border border-red-300">
                    Unpaid
                  </span>
                )}
              </p>

              <p className="flex items-center gap-3 text-[#ff0707] font-semibold">
                <ClockAlert size={20} className="text-red-600" />
                Membership Ends On:{" "}
                {member.plan === "No Plan"
                  ? "-"
                  : calculateExpiryDate(member)
                  ? calculateExpiryDate(member).toLocaleDateString("en-GB")
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && (newProfilePicture || member?.profilePicture) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={newProfilePicture || member?.profilePicture!}
            alt={member?.name || "Member"}
            className="max-h-[80vh] max-w-[80vw] rounded-xl shadow-2xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Payment History */}
      {!editing && (
        <div className="bg-white rounded-3xl p-10 max-w-6xl mx-auto shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-[#0A2463] flex items-center gap-2 mb-6">
            <History size={24} className="text-[#FFC107]" /> Payment History
          </h3>

          {member.payments && member.payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-md">
                <thead className="bg-[#FFC107] text-[#0A2463] uppercase tracking-wider">
                  <tr>
                    <th className="text-center px-6 py-3">Plan</th>
                    <th className="text-center px-6 py-3">Amount (₹)</th>
                    <th className="text-center px-6 py-3">Mode of Payment</th>
                    <th className="text-center px-6 py-3">Date</th>
                    <th className="text-center px-6 py-3">Due Date</th>
                    <th className="text-center px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {member.payments
                    ?.slice()
                    .reverse()
                    .map((payment, pIdx) => {
                      // Calculate total paid & remaining
                      const totalPaid = payment.installments.reduce(
                        (sum, inst) => sum + inst.amountPaid,
                        0
                      );
                      const remaining = payment.actualAmount - totalPaid;
                      const isPaid = remaining <= 0;

                      // Determine overall status
                      const statusLabel = isPaid
                        ? "Paid"
                        : `Pending ₹${remaining.toFixed(2)}`;

                      return payment.installments.map((inst, iIdx) => (
                        <tr
                          key={`${pIdx}-${iIdx}`}
                          className={`${
                            (pIdx + iIdx) % 2 === 0 ? "bg-gray-50" : "bg-white"
                          } hover:bg-gray-100`}
                        >
                          <td className="px-6 py-4 font-medium text-[#0A2463] text-center">
                            {payment.plan}
                          </td>
                          <td className="px-6 py-4 font-semibold text-green-600 text-center">
                            ₹{inst.amountPaid}
                          </td>
                          <td className="px-6 py-4 text-[#212529] text-center">
                            {inst.modeOfPayment || "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center">
                            {inst.paymentDate
                              ? new Date(inst.paymentDate).toLocaleDateString(
                                  "en-GB"
                                )
                              : "—"}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center">
                            {isPaid
                              ? "—" // ✅ clear due date if fully paid
                              : inst.dueDate
                              ? new Date(inst.dueDate).toLocaleDateString(
                                  "en-GB"
                                )
                              : "—"}
                          </td>

                          <td className="px-6 py-4 text-center">
                            {isPaid ? (
                              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 border border-green-300">
                                Paid
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedPayment({
                                    paymentId: payment._id!,
                                    remaining,
                                    plan: payment.plan,
                                  });
                                  setShowPayModal(true);
                                  setPayAmount(remaining);
                                }}
                                className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition"
                              >
                                Pending ₹{remaining.toFixed(2)}
                              </button>
                            )}
                          </td>
                        </tr>
                      ));
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No payments recorded yet.</p>
          )}
        </div>
      )}

      {/* Edit Form */}
      {editing && memberData && (
        <div className="mt-6 bg-white p-10 rounded-3xl max-w-1/3 mx-auto shadow-xl border border-gray-200">
          <h3 className="text-3xl font-bold text-[#0A2463] mb-8 flex items-center gap-3">
            <Edit size={28} className="text-[#0A2463]" />
            Edit Member
          </h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!memberData.name || !memberData.mobile || !memberData.email) {
                alert("All fields are required");
                return;
              }
              try {
                const res = await fetch(`/api/members/${member._id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(memberData),
                });
                if (res.ok) {
                  const updated = await res.json();
                  setMember(updated.member);
                  setEditing(false);
                } else {
                  alert("Update failed");
                }
              } catch (err) {
                console.error(err);
                alert("Update failed");
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Name Field */}
            <div className="flex flex-col md:col-span-full">
              <label className="mb-2 text-xl font-semibold text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={memberData.name}
                onChange={(e) =>
                  setMemberData({ ...memberData, name: e.target.value })
                }
                required
                placeholder="Full Name"
                className="w-full px-4 py-3 rounded-xl text-lg border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition"
              />
            </div>

            {/* Mobile Field */}
            <div className="flex flex-col md:col-span-full">
              <label className="mb-2 text-xl font-semibold text-gray-700">
                Mobile
              </label>
              <input
                type="text"
                value={memberData.mobile}
                onChange={(e) =>
                  setMemberData({ ...memberData, mobile: e.target.value })
                }
                required
                placeholder="Mobile Number"
                className="w-full px-4 py-3 rounded-xl border text-lg border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition"
              />
            </div>

            {/* Email Field */}
            <div className="flex flex-col md:col-span-full">
              <label className="mb-2 text-xl font-semibold text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={memberData.email || ""}
                onChange={(e) =>
                  setMemberData({ ...memberData, email: e.target.value })
                }
                required
                placeholder="Email Address"
                className="w-full px-4 py-3 rounded-xl border text-lg border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 flex justify-end gap-4 mt-6">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✅ Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-10 rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-200">
            <h3 className="text-3xl font-bold text-[#0A2463] mb-6 flex items-center gap-3">
              <RefreshCcw size={28} className="text-[#FFC107]" />
              Avail Membership
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Selection */}
              <div className="flex flex-col">
                <label className="text-[#0A2463] text-lg font-semibold mb-2">
                  Select Plan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={renewPlan}
                  onChange={(e) => setRenewPlan(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
                >
                  <option value="" disabled hidden>
                    Select Plan
                  </option>
                  {[...allPlans]
                    .sort((a, b) => {
                      const typeOrder =
                        a.validityType === b.validityType
                          ? 0
                          : a.validityType === "days"
                          ? -1
                          : 1;
                      return typeOrder === 0
                        ? a.validity - b.validity
                        : typeOrder;
                    })
                    .map((p) => (
                      <option key={p._id} value={p.name}>
                        {p.name}{" "}
                        {p.validity ? `- ${p.validity} ${p.validityType}` : ""}
                      </option>
                    ))}
                  <option value="Custom">Custom Plan</option>
                </select>
              </div>

              {/* Payment Option */}
              <div className="flex flex-col">
                <label className="text-[#0A2463] text-lg font-semibold mb-2">
                  Payment Option <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentOption}
                  onChange={(e) => setPaymentOption(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
                >
                  <option value="One Time">One Time</option>
                  <option value="Installment">Installment</option>
                </select>
              </div>

              {/* Custom Plan Fields */}
              {renewPlan === "Custom" && (
                <>
                  <div className="flex flex-col">
                    <label className="text-[#0A2463] text-lg font-semibold mb-2">
                      Custom Validity
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Validity"
                      value={customValidity}
                      onChange={(e) =>
                        setCustomValidity(Number(e.target.value))
                      }
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[#0A2463] text-lg font-semibold mb-2">
                      Validity Type
                    </label>
                    <select
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </>
              )}

              {/* 🟢 One-Time Payment Section */}
              {paymentOption === "One Time" && (
                <>
                  {/* Amount Paid */}
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-[#0A2463] text-lg font-semibold mb-2">
                      Amount Paid (₹)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={useDefaultPrice}
                        onChange={(e) => setUseDefaultPrice(e.target.checked)}
                      />
                      <span className="text-gray-700">
                        Use default plan price (
                        {renewPlan &&
                        allPlans.find((p) => p.name === renewPlan)?.amount
                          ? `₹${
                              allPlans.find((p) => p.name === renewPlan)?.amount
                            }`
                          : "—"}
                        )
                      </span>
                    </div>
                    {useDefaultPrice ? (
                      <input
                        type="number"
                        value={
                          allPlans.find((p) => p.name === renewPlan)?.amount ||
                          ""
                        }
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-700"
                      />
                    ) : (
                      <input
                        type="number"
                        placeholder="Enter custom price"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                      />
                    )}
                  </div>

                  {/* 🟩 Date of Join + Payment Mode in same row */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-lg font-semibold mb-2">
                        Date of Join <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={
                          joinDateInput ||
                          new Date().toISOString().split("T")[0]
                        }
                        onChange={(e) => setJoinDateInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-lg font-semibold mb-2">
                        Payment Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={renewMode}
                        onChange={(e) => setRenewMode(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                      >
                        <option value="" disabled hidden>
                          Select Payment Mode
                        </option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* 🟣 Installment Fields */}
              {paymentOption === "Installment" && (
                <>
                  {/* Actual Amount (editable toggle) */}
                  <div className="flex flex-col md:col-span-2 space-y-3">
                    <label className="text-[#0A2463] text-lg font-semibold mb-1">
                      Actual Amount (₹)
                    </label>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        checked={useDefaultPrice}
                        onChange={(e) => setUseDefaultPrice(e.target.checked)}
                      />
                      <span className="text-gray-700">
                        Use default plan price (
                        {renewPlan &&
                        allPlans.find((p) => p.name === renewPlan)?.amount
                          ? `₹${
                              allPlans.find((p) => p.name === renewPlan)?.amount
                            }`
                          : "—"}
                        )
                      </span>
                    </div>

                    {useDefaultPrice ? (
                      <input
                        type="number"
                        value={
                          allPlans.find((p) => p.name === renewPlan)?.amount ||
                          ""
                        }
                        disabled
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-700"
                      />
                    ) : (
                      <input
                        type="number"
                        placeholder="Enter custom actual amount"
                        value={actualAmount}
                        onChange={(e) =>
                          setActualAmount(Number(e.target.value))
                        }
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                      />
                    )}
                  </div>

                  {/* Installment Fee */}
                  <div className="flex flex-col">
                    <label className="text-[#0A2463] text-lg font-semibold mb-2">
                      Installment Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={installmentFee}
                      onChange={(e) =>
                        setInstallmentFee(Number(e.target.value))
                      }
                      placeholder="Enter extra fee"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                    />
                  </div>

                  {/* Amount Paid */}
                  <div className="flex flex-col">
                    <label className="text-[#0A2463] text-lg font-semibold mb-2">
                      Amount Paid (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50"
                    />
                  </div>

                  {/* ✅ Fixed Remaining Amount Logic */}
                  <div className="flex flex-col">
                    <label className="text-[#0A2463] text-lg font-semibold mb-2">
                      Remaining Amount (₹)
                    </label>
                    <input
                      type="number"
                      disabled
                      value={Math.max(
                        (Number(
                          useDefaultPrice
                            ? allPlans.find((p) => p.name === renewPlan)?.amount
                            : actualAmount
                        ) || 0) +
                          (Number(installmentFee) || 0) -
                          (Number(amountPaid) || 0),
                        0
                      )}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-700"
                    />
                  </div>

                  {/* Due Date */}
                  <div className="flex flex-col">
                    <label className="text-[#0A2463] text-lg font-semibold mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50"
                    />
                  </div>

                  {/* 🟩 Payment Mode + Date of Join in same row */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-lg font-semibold mb-2">
                        Date of Join <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={
                          joinDateInput ||
                          new Date().toISOString().split("T")[0]
                        }
                        onChange={(e) => setJoinDateInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-lg font-semibold mb-2">
                        Payment Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={renewMode}
                        onChange={(e) => setRenewMode(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463]"
                      >
                        <option value="" disabled hidden>
                          Select Payment Mode
                        </option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={handleRenew}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow"
              >
                Confirm Renewal
              </button>
              <button
                onClick={() => setShowRenewModal(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💰 Pay Remaining Modal */}
      {showPayModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-2xl font-bold text-[#0A2463] mb-6 text-center">
              Pay Remaining Amount
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-[#0A2463] text-lg font-semibold mb-2 block">
                  Remaining Amount
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#0A2463] text-lg font-semibold mb-2 block">
                  Mode of Payment
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                >
                  <option value="" disabled hidden>
                    Select Payment Mode
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={async () => {
                  if (!payAmount || !payMode) {
                    alert("Please fill all fields");
                    return;
                  }

                  try {
                    const res = await fetch(`/api/members/${member?._id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        paymentId: selectedPayment.paymentId,
                        additionalInstallment: {
                          amountPaid: Number(payAmount),
                          paymentDate: new Date(),
                          modeOfPayment: payMode,
                        },
                        markAsPaid: true, // ✅ backend will check if full paid
                      }),
                    });

                    if (!res.ok) throw new Error("Payment failed");

                    const updated = await res.json();
                    setMember(updated.member);
                    setShowPayModal(false);
                    setPayMode("");
                    setPayAmount("");

                    // ✅ Success popup
                    setShowFeedbackModal({
                      type: "success",
                      message: "Payment recorded successfully! 💰",
                    });
                  } catch (err) {
                    console.error(err);
                    // ❌ Error popup
                    setShowFeedbackModal({
                      type: "error",
                      message: "Payment failed! Please try again.",
                    });
                  }
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setPayMode("");
                  setPayAmount("");
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-10 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-3xl font-bold text-red-600 mb-6 flex items-center gap-3">
              <Trash2 size={28} className="text-red-600" />
              Delete Member
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to permanently delete{" "}
              <strong>{member.name}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/members/${member._id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      router.push("/members");
                    } else {
                      alert("Failed to delete member");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Failed to delete member");
                  }
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition font-semibold shadow"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ✅ Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className={`p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full transition-all
      ${
        showFeedbackModal.type === "success"
          ? "bg-green-50 text-green-700 border border-green-300"
          : "bg-red-50 text-red-700 border border-red-300"
      }`}
          >
            <h3 className="text-2xl font-bold mb-2">
              {showFeedbackModal.type === "success" ? "✅ Success" : "❌ Error"}
            </h3>
            <p className="text-lg">{showFeedbackModal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
