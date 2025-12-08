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
  ImagePlus, // ⬅️ add this
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
  joinDate?: string;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

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
  >("Unpaid");

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

  const [paymentOption, setPaymentOption] = useState("One Time");
  const [actualAmount, setActualAmount] = useState<number | "">("");
  const [amountPaid, setAmountPaid] = useState<number | "">("");
  const [remainingAmount, setRemainingAmount] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [joinDateInput, setJoinDateInput] = useState("");

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    paymentId: string;
    remaining: number;
    plan: string;
  } | null>(null);
  const [payMode, setPayMode] = useState("");
  const [payAmount, setPayAmount] = useState<number | "">("");

  const [useDefaultPrice, setUseDefaultPrice] = useState(true);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [installmentFee, setInstallmentFee] = useState<number | "">("");

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
      const timer = setTimeout(() => setShowFeedbackModal(null), 2000);
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
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;
        case "year":
        case "years":
          expiryDate.setFullYear(expiryDate.getFullYear() + value);
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;
      }
      return expiryDate;
    }

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
          expiryDate.setDate(expiryDate.getDate() - 1);
          break;
        default:
          expiryDate.setMonth(expiryDate.getMonth() + 1);
          expiryDate.setDate(expiryDate.getDate() - 1);
      }
      return expiryDate;
    }

    expiryDate.setMonth(expiryDate.getMonth() + 1);
    expiryDate.setDate(expiryDate.getDate() - 1);
    return expiryDate;
  };

  const getMembershipStatus = (m: Member): "Active" | "Inactive" => {
    // If no plan or explicitly "No Plan" → Inactive
    if (!m.plan || m.plan.toLowerCase() === "no plan") {
      return "Inactive";
    }

    const expiryDate = calculateExpiryDate(m);
    const today = new Date();

    // Compare only date part (ignore time)
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return expiryDate.getTime() >= todayMidnight.getTime()
      ? "Active"
      : "Inactive";
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
  const membershipStatus = getMembershipStatus(member);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E9ECEF] via-[#F8F9FA] to-white px-3 sm:px-3 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-6 lg:space-y-10">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <h1 className="flex items-center gap-3 sm:gap-4 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A2463]">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#0A2463] text-[#FFC107] shadow-md">
            <UserCircle size={26} />
          </span>
          <span>Member Profile</span>
        </h1>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#0A2463] text-white text-sm sm:text-base shadow hover:bg-[#152b7a] transition"
          >
            <Edit size={18} /> Edit
          </button>
          <button
            onClick={() => setShowRenewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#FFC107] text-[#0A2463] font-semibold text-sm sm:text-base shadow hover:bg-[#e0a800] transition"
          >
            <RefreshCcw size={18} /> Renew Plan
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-600 text-white text-sm sm:text-base shadow hover:bg-red-700 transition"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Member Card */}
      {!editing && (
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg border border-gray-200">
            {/* Desktop badge – top-right */}
            {member.status && (
              <span
                className={`hidden md:inline-flex absolute top-5 right-5 px-4 py-2 rounded-full text-sm font-semibold shadow-lg
    ${
      membershipStatus === "Active"
        ? "bg-green-600 text-white"
        : "bg-red-600 text-white"
    }`}
              >
                {membershipStatus}
              </span>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Profile */}
              <div className="flex flex-col items-center">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36">
                  {newProfilePicture || member?.profilePicture ? (
                    <img
                      src={newProfilePicture || member?.profilePicture!}
                      alt={member?.name || "Member"}
                      className="w-full h-full rounded-full object-cover shadow-md border-4 border-[#FFC107] cursor-pointer"
                      onClick={() => setShowLightbox(true)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#FFC107] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-md">
                      {member?.name ? getInitials(member.name) : "NA"}
                    </div>
                  )}

                  {/* Camera input (opens camera on phone) */}
                  <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment" // ⬅️ forces camera on most mobiles
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <Camera size={20} className="text-[#0A2463]" />
                  </label>

                  {/* Gallery / file input */}
                  <label className="absolute bottom-0 left-0 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <ImagePlus size={20} className="text-[#0A2463]" />
                  </label>

                  {/* Upload Status */}
                  {uploading && (
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-blue-600 font-semibold">
                      Uploading...
                    </span>
                  )}
                  {uploadSuccess && (
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-green-600 font-semibold">
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

                <h2 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-[#0A2463] text-center">
                  {member.name}
                </h2>

                {/* Mobile status badge (no overflow) */}
                {member.status && (
                  <span
                    className={`mt-2 md:hidden inline-flex px-3 py-1 rounded-full text-xs font-semibold
    ${
      membershipStatus === "Active"
        ? "bg-green-100 text-green-700 border border-green-300"
        : "bg-red-100 text-red-700 border border-red-300"
    }`}
                  >
                    {membershipStatus}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="md:col-span-2 space-y-3 sm:space-y-4 text-[#212529] text-sm sm:text-base lg:text-lg">
                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Phone size={18} className="text-purple-600" />
                  <strong>Mobile:</strong> <span>{member.mobile}</span>
                </p>
                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Calendar size={18} className="text-pink-600" />
                  <strong>Date of Birth:</strong>
                  <span>
                    {new Date(member.dob).toLocaleDateString("en-GB")}
                  </span>
                </p>

                {member.email && (
                  <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Mail size={18} className="text-red-600" />
                    <strong>Email:</strong> <span>{member.email}</span>
                  </p>
                )}

                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Calendar size={18} className="text-blue-600" />
                  <strong>Registration Date:</strong>
                  <span>
                    {member.joinDate
                      ? new Date(member.joinDate).toLocaleDateString("en-GB")
                      : "-"}
                  </span>
                </p>

                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Calendar size={18} className="text-indigo-600" />
                  <strong>Renewal Date:</strong>
                  <span>
                    {member.payments && member.payments.length > 0
                      ? new Date(
                          member.payments[
                            member.payments.length - 1
                          ].installments[0]?.paymentDate
                        ).toLocaleDateString("en-GB")
                      : "-"}
                  </span>
                </p>

                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <CreditCard size={18} className="text-green-600" />
                  <strong>Current Plan:</strong>
                  <span>{currentPlan}</span>
                  {currentPaymentStatus === "Paid" ? (
                    <span className="ml-2 px-3 py-1 text-xs sm:text-sm font-semibold rounded-full bg-green-100 text-green-700 border border-green-300">
                      Paid
                    </span>
                  ) : (
                    <span className="ml-2 px-3 py-1 text-xs sm:text-sm font-semibold rounded-full bg-red-100 text-red-700 border border-red-300">
                      Unpaid
                    </span>
                  )}
                </p>

                <p className="flex flex-wrap items-center gap-2 sm:gap-3 text-[#ff0707] font-semibold">
                  <ClockAlert size={18} className="text-red-600" />
                  <span>Membership Ends On:</span>
                  <span>
                    {member.plan === "No Plan"
                      ? "-"
                      : calculateExpiryDate(member)
                      ? calculateExpiryDate(member).toLocaleDateString("en-GB")
                      : "-"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && (newProfilePicture || member?.profilePicture) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={newProfilePicture || member?.profilePicture!}
            alt={member?.name || "Member"}
            className="max-h-[80vh] max-w-[80vw] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Payment History */}
      {!editing && (
        <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-md px-3 sm:px-3 lg:px-8 py-5 sm:py-7">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0A2463] flex items-center gap-2">
              <History size={22} className="text-[#FFC107]" />
              Payment History
            </h3>
          </div>

          {member.payments && member.payments.length > 0 ? (
            // ➜ card is fixed, only table content scrolls (like coach page)
            <div className="w-full overflow-x-auto -mx-1 sm:mx-0">
              <div className="table-scroll rounded-2xl border border-slate-100">
                <table className="w-full bg-white text-[11px] sm:text-sm lg:text-base">
                  <thead className="bg-[#FFC107] text-[#0A2463] uppercase tracking-wider">
                    <tr>
                      <th className="text-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                        Plan
                      </th>
                      <th className="text-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                        Amount (₹)
                      </th>
                      <th className="text-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                        Mode
                      </th>
                      <th className="text-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                        Date
                      </th>
                      <th className="text-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                        Due Date
                      </th>
                      <th className="text-center px-2 sm:px-3 lg:px-4 py-2 sm:py-3">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {member.payments
                      ?.slice()
                      .reverse()
                      .map((payment, pIdx) => {
                        const totalPaid = payment.installments.reduce(
                          (sum, inst) => sum + inst.amountPaid,
                          0
                        );
                        const remaining = payment.actualAmount - totalPaid;
                        const isPaid = remaining <= 0;

                        return payment.installments.map((inst, iIdx) => (
                          <tr
                            key={`${pIdx}-${iIdx}`}
                            className={`${
                              (pIdx + iIdx) % 2 === 0
                                ? "bg-gray-50"
                                : "bg-white"
                            } hover:bg-gray-100`}
                          >
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 font-medium text-[#0A2463] text-center whitespace-nowrap">
                              {payment.plan}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 font-semibold text-green-600 text-center whitespace-nowrap">
                              ₹{inst.amountPaid}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-[#212529] text-center whitespace-nowrap">
                              {inst.modeOfPayment || "—"}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-gray-600 text-center whitespace-nowrap">
                              {inst.paymentDate
                                ? new Date(inst.paymentDate).toLocaleDateString(
                                    "en-GB"
                                  )
                                : "—"}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-gray-600 text-center whitespace-nowrap">
                              {isPaid
                                ? "—"
                                : inst.dueDate
                                ? new Date(inst.dueDate).toLocaleDateString(
                                    "en-GB"
                                  )
                                : "—"}
                            </td>
                            <td className="px-2 sm:px-3 lg:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                              {isPaid ? (
                                <span className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-green-100 text-green-700 border border-green-300">
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
                                  className="px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition"
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
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm sm:text-base">
              No payments recorded yet.
            </p>
          )}
        </div>
      )}

      {/* Edit Form */}
      {editing && memberData && (
        <div className="mt-4 sm:mt-6 bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-8 rounded-3xl max-w-3xl mx-auto shadow-xl border border-gray-200">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-4 sm:mb-6 flex items-center gap-2">
            <Edit size={24} className="text-[#0A2463]" />
            Edit Member
          </h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!memberData.name || !memberData.mobile || !memberData.email) {
                setShowFeedbackModal({
                  type: "error",
                  message: "All fields are required.",
                });
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
                  setShowFeedbackModal({
                    type: "success",
                    message: "Member details updated successfully! ✅",
                  });
                } else {
                  setShowFeedbackModal({
                    type: "error",
                    message: "Update failed! Please try again.",
                  });
                }
              } catch (err) {
                console.error(err);
                setShowFeedbackModal({
                  type: "error",
                  message: "Error updating member details.",
                });
              }
            }}
            className="grid grid-cols-1 gap-4"
          >
            <div className="flex flex-col">
              <label className="mb-1.5 text-sm sm:text-base font-semibold text-gray-700">
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
                className="w-full px-4 py-2.5 rounded-xl text-sm sm:text-base border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1.5 text-sm sm:text-base font-semibold text-gray-700">
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
                className="w-full px-4 py-2.5 rounded-xl border text-sm sm:text-base border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1.5 text-sm sm:text-base font-semibold text-gray-700">
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
                className="w-full px-4 py-2.5 rounded-xl border text-sm sm:text-base border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC107] transition"
              />
            </div>

            <div className="flex justify-end gap-3 mt-3 sm:mt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition font-semibold shadow text-sm sm:text-base"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="bg-gray-500 text-white px-5 py-2.5 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-3 py-6">
            <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-3xl max-w-3xl w-full mx-auto shadow-2xl border border-gray-200">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0A2463] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <RefreshCcw size={26} className="text-[#FFC107]" />
                Avail Membership
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Plan Selection */}
                <div className="flex flex-col">
                  <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                    Select Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={renewPlan}
                    onChange={(e) => setRenewPlan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
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
                          {p.validity
                            ? `- ${p.validity} ${p.validityType}`
                            : ""}
                        </option>
                      ))}
                    <option value="Custom">Custom Plan</option>
                  </select>
                </div>

                {/* Payment Option */}
                <div className="flex flex-col">
                  <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                    Payment Option <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentOption}
                    onChange={(e) => setPaymentOption(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
                  >
                    <option value="One Time">One Time</option>
                    <option value="Installment">Installment</option>
                  </select>
                </div>

                {/* Custom plan fields */}
                {renewPlan === "Custom" && (
                  <>
                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
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
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                        Validity Type
                      </label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </>
                )}

                {/* One-time payment */}
                {paymentOption === "One Time" && (
                  <>
                    <div className="flex flex-col md:col-span-2 space-y-3">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-1">
                        Amount Paid (₹)
                      </label>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
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
                                allPlans.find((p) => p.name === renewPlan)
                                  ?.amount
                              }`
                            : "—"}
                          )
                        </span>
                      </div>
                      {useDefaultPrice ? (
                        <input
                          type="number"
                          value={
                            allPlans.find((p) => p.name === renewPlan)
                              ?.amount || ""
                          }
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 text-sm sm:text-base"
                        />
                      ) : (
                        <input
                          type="number"
                          placeholder="Enter custom price"
                          value={customPrice}
                          onChange={(e) =>
                            setCustomPrice(Number(e.target.value))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
                        />
                      )}
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="flex flex-col">
                        <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                          Payment Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={renewMode}
                          onChange={(e) => setRenewMode(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
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

                {/* Installment fields */}
                {paymentOption === "Installment" && (
                  <>
                    <div className="flex flex-col md:col-span-2 space-y-3">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-1">
                        Actual Amount (₹)
                      </label>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
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
                                allPlans.find((p) => p.name === renewPlan)
                                  ?.amount
                              }`
                            : "—"}
                          )
                        </span>
                      </div>

                      {useDefaultPrice ? (
                        <input
                          type="number"
                          value={
                            allPlans.find((p) => p.name === renewPlan)
                              ?.amount || ""
                          }
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 text-sm sm:text-base"
                        />
                      ) : (
                        <input
                          type="number"
                          placeholder="Enter custom actual amount"
                          value={actualAmount}
                          onChange={(e) =>
                            setActualAmount(Number(e.target.value))
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
                        />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                        Installment Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={installmentFee}
                        onChange={(e) =>
                          setInstallmentFee(Number(e.target.value))
                        }
                        placeholder="Enter extra fee"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                        Amount Paid (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                        Remaining Amount (₹)
                      </label>
                      <input
                        type="number"
                        disabled
                        value={Math.max(
                          (Number(
                            useDefaultPrice
                              ? allPlans.find((p) => p.name === renewPlan)
                                  ?.amount
                              : actualAmount
                          ) || 0) +
                            (Number(installmentFee) || 0) -
                            (Number(amountPaid) || 0),
                          0
                        )}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 text-sm sm:text-base"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base"
                      />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="flex flex-col">
                        <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
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
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2">
                          Payment Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={renewMode}
                          onChange={(e) => setRenewMode(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463]"
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

              <div className="flex justify-end gap-3 sm:gap-4 mt-6">
                <button
                  onClick={handleRenew}
                  className="bg-green-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow text-sm sm:text-base"
                >
                  Confirm Renewal
                </button>
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="bg-gray-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Remaining Modal */}
      {showPayModal && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full mx-3 shadow-2xl border border-gray-200">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-4 sm:mb-6 text-center">
              Pay Remaining Amount
            </h3>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2 block">
                  Remaining Amount
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[#0A2463] text-sm sm:text-base font-semibold mb-2 block">
                  Mode of Payment
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                >
                  <option value="" disabled hidden>
                    Select Payment Mode
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 sm:gap-4 mt-6 sm:mt-8">
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
                        markAsPaid: true,
                      }),
                    });

                    if (!res.ok) throw new Error("Payment failed");

                    const updated = await res.json();
                    setMember(updated.member);
                    setShowPayModal(false);
                    setPayMode("");
                    setPayAmount("");

                    setShowFeedbackModal({
                      type: "success",
                      message: "Payment recorded successfully! 💰",
                    });
                  } catch (err) {
                    console.error(err);
                    setShowFeedbackModal({
                      type: "error",
                      message: "Payment failed! Please try again.",
                    });
                  }
                }}
                className="bg-green-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow text-sm sm:text-base"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setPayMode("");
                  setPayAmount("");
                }}
                className="bg-gray-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
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
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full mx-3 shadow-2xl border border-gray-200">
            <h3 className="text-xl sm:text-2xl font-bold text-red-600 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Trash2 size={24} className="text-red-600" />
              Delete Member
            </h3>
            <p className="text-gray-700 mb-5 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to permanently delete{" "}
              <strong>{member.name}</strong>?
            </p>
            <div className="flex justify-end gap-3 sm:gap-4">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/members/${member._id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      setShowFeedbackModal({
                        type: "success",
                        message: "Member deleted successfully! 🗑️",
                      });
                      setTimeout(() => router.push("/members"), 2000);
                    } else {
                      setShowFeedbackModal({
                        type: "error",
                        message: "Failed to delete member. Try again.",
                      });
                    }
                  } catch (err) {
                    console.error(err);
                    setShowFeedbackModal({
                      type: "error",
                      message: "Error deleting member.",
                    });
                  } finally {
                    setShowDeleteModal(false);
                  }
                }}
                className="bg-red-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-red-700 transition font-semibold shadow text-sm sm:text-base"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className={`p-5 sm:p-6 rounded-3xl shadow-2xl text-center max-w-sm w-full mx-4 transition-all
        ${
          showFeedbackModal.type === "success"
            ? "bg-green-50 text-green-700 border border-green-300"
            : "bg-red-50 text-red-700 border border-red-300"
        }`}
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              {showFeedbackModal.type === "success" ? "✅ Success" : "❌ Error"}
            </h3>
            <p className="text-sm sm:text-lg">{showFeedbackModal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
