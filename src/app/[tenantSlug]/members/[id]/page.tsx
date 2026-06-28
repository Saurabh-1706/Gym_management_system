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
  Download,
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
  const { id, tenantSlug } = useParams();
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
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const res = await fetch(`/api/reports/member/${id}`);
      if (!res.ok) throw new Error("Failed to export member report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Member_Report_${member?.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error exporting PDF");
    } finally {
      setExporting(false);
    }
  };

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
      <div className="flex items-center justify-center min-h-screen bg-[#0F0F0F]">
        <Loader text="Loading member profile..." />
      </div>
    );

  if (!member)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-550 text-xl bg-[#0F0F0F]">
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
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 lg:space-y-10 font-body">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <h1 className="flex items-center gap-3 sm:gap-4 text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316]">
          <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <UserCircle size={26} />
          </span>
          <span>Member Profile</span>
        </h1>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-[#e5e2e1] border border-zinc-700 text-sm sm:text-base shadow hover:bg-zinc-750 transition cursor-pointer"
          >
            <Edit size={18} /> Edit
          </button>
          <button
            onClick={() => setShowRenewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f97316] hover:bg-[#ff8c3a] text-white font-headline text-lg tracking-wider shadow transition cursor-pointer animate-pulse"
          >
            <RefreshCcw size={18} /> Renew Plan
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 text-[#e5e2e1] border border-zinc-700 text-sm sm:text-base shadow hover:bg-zinc-750 transition cursor-pointer disabled:opacity-50"
          >
            <Download size={18} /> {exporting ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-650 text-white text-sm sm:text-base shadow hover:bg-red-700 transition cursor-pointer"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Member Card */}
      {!editing && (
        <div className="max-w-6xl mx-auto">
          <div className="relative glass-card rounded-xl p-6 sm:p-8 lg:p-10 shadow-lg border-[#2A2A2A]">
            {/* Desktop badge – top-right */}
            {member.status && (
              <span
                className={`hidden md:inline-flex absolute top-5 right-5 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg
    ${
      membershipStatus === "Active"
        ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25"
        : "bg-red-500/15 text-red-400 border border-red-500/25"
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
                      className="w-full h-full rounded-full object-cover shadow-md border-4 border-[#f97316] cursor-pointer"
                      onClick={() => setShowLightbox(true)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#f97316] flex items-center justify-center text-white text-3xl sm:text-4xl font-headline tracking-widest shadow-md">
                      {member?.name ? getInitials(member.name) : "NA"}
                    </div>
                  )}

                  {/* Camera input (opens camera on phone) */}
                  <label className="absolute bottom-0 right-0 bg-[#111111] border-[#2A2A2A] p-2 rounded-full shadow cursor-pointer hover:bg-white/10 text-primary">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment" // ⬅️ forces camera on most mobiles
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <Camera size={20} className="text-[#f97316]" />
                  </label>

                  {/* Gallery / file input */}
                  <label className="absolute bottom-0 left-0 bg-[#111111] border-[#2A2A2A] p-2 rounded-full shadow cursor-pointer hover:bg-white/10 text-primary">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <ImagePlus size={20} className="text-[#f97316]" />
                  </label>

                  {/* Upload Status */}
                  {uploading && (
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-[#f97316] font-semibold">
                      Uploading...
                    </span>
                  )}
                  {uploadSuccess && (
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-[#22c55e] font-semibold">
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

                <h2 className="mt-3 sm:mt-4 text-2xl font-headline tracking-wider text-[#f97316] text-center">
                  {member.name}
                </h2>

                {/* Mobile status badge (no overflow) */}
                {member.status && (
                  <span
                    className={`mt-2 md:hidden inline-flex px-3 py-1 rounded-xl text-xs font-semibold
     ${
       membershipStatus === "Active"
         ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25"
         : "bg-red-500/15 text-red-400 border border-red-500/25"
     }`}
                  >
                    {membershipStatus}
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="md:col-span-2 space-y-3 sm:space-y-4 text-[#e0c0b1] text-sm sm:text-base lg:text-lg">
                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Phone size={18} className="text-purple-400" />
                  <strong className="text-[#e5e2e1]">Mobile:</strong> <span>{member.mobile}</span>
                </p>
                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Calendar size={18} className="text-pink-400" />
                  <strong className="text-[#e5e2e1]">Date of Birth:</strong>
                  <span>
                    {new Date(member.dob).toLocaleDateString("en-GB")}
                  </span>
                </p>

                {member.email && (
                  <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Mail size={18} className="text-red-400" />
                    <strong className="text-[#e5e2e1]">Email:</strong> <span>{member.email}</span>
                  </p>
                )}

                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Calendar size={18} className="text-blue-400" />
                  <strong className="text-[#e5e2e1]">Registration Date:</strong>
                  <span>
                    {member.joinDate
                      ? new Date(member.joinDate).toLocaleDateString("en-GB")
                      : "-"}
                  </span>
                </p>

                <p className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Calendar size={18} className="text-indigo-400" />
                  <strong className="text-[#e5e2e1]">Renewal Date:</strong>
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
                  <CreditCard size={18} className="text-[#22c55e]" />
                  <strong className="text-[#e5e2e1]">Current Plan:</strong>
                  <span className="px-2.5 py-0.5 bg-white/5 border border-white/5 text-zinc-300 rounded-full text-xs font-semibold">{currentPlan}</span>
                  {currentPaymentStatus === "Paid" ? (
                    <span className="ml-2 px-3 py-1 text-xs sm:text-sm font-semibold rounded-xl bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25">
                      Paid
                    </span>
                  ) : (
                    <span className="ml-2 px-3 py-1 text-xs sm:text-sm font-semibold rounded-xl bg-red-500/15 text-red-400 border border-red-500/25">
                      Unpaid
                    </span>
                  )}
                </p>

                <p className="flex flex-wrap items-center gap-2 sm:gap-3 text-red-450 font-semibold">
                  <ClockAlert size={18} className="text-red-500" />
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
        <div className="max-w-6xl mx-auto glass-card border-[#2A2A2A] shadow-md px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-2xl sm:text-3xl font-headline tracking-wider text-[#f97316] flex items-center gap-2">
              <History size={22} className="text-[#f97316]" />
              Payment History
            </h3>
          </div>

          {member.payments && member.payments.length > 0 ? (
            <div className="w-full overflow-x-auto">
              <div className="rounded-xl border-[#2A2A2A] overflow-hidden bg-[#0A0A0A]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="table-thead">
              <tr>
                      <th className="px-4 py-3.5">Plan</th>
                      <th className="px-4 py-3.5 text-center">Amount (₹)</th>
                      <th className="px-4 py-3.5 text-center">Mode</th>
                      <th className="px-4 py-3.5 text-center">Date</th>
                      <th className="px-4 py-3.5 text-center">Due Date</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-zinc-300">
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
                            className="hover:bg-white/5 transition"
                          >
                            <td className="px-4 py-3.5 font-medium text-[#e5e2e1] whitespace-nowrap">
                              {payment.plan}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-[#22c55e] text-center whitespace-nowrap">
                              ₹{inst.amountPaid}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap text-zinc-400">
                              {inst.modeOfPayment || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap text-zinc-400">
                              {inst.paymentDate
                                ? new Date(inst.paymentDate).toLocaleDateString(
                                    "en-GB"
                                  )
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap text-zinc-400">
                              {isPaid
                                ? "—"
                                : inst.dueDate
                                ? new Date(inst.dueDate).toLocaleDateString(
                                    "en-GB"
                                  )
                                : "—"}
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              {isPaid ? (
                                <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-xl bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/25">
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
                                  className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-xl bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/30 transition cursor-pointer"
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
            <p className="text-zinc-500 text-center py-6 text-sm sm:text-base">
              No payments recorded yet.
            </p>
          )}
        </div>
      )}

      {/* Edit Form */}
      {editing && memberData && (
        <div className="mt-4 sm:mt-6 glass-card px-4 sm:px-6 lg:px-8 py-6 sm:py-8 rounded-2xl max-w-3xl mx-auto shadow-xl border-[#2A2A2A]">
          <h3 className="text-2xl font-headline tracking-wider text-[#f97316] mb-4 sm:mb-6 flex items-center gap-2 uppercase">
            <Edit size={24} className="text-[#f97316]" />
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
              <label className="mb-1.5 text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest block ml-1">
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
                className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1.5 text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest block ml-1">
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
                className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-1.5 text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest block ml-1">
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
                className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
              />
            </div>

            <div className="flex justify-end gap-3 mt-3 sm:mt-4">
              <button
                type="submit"
                className="btn-primary px-5 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary px-5 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-center justify-center px-4 py-6">
            <div className="glass-card p-6 sm:p-8 lg:p-10 rounded-2xl max-w-3xl w-full mx-auto shadow-2xl border-[#2A2A2A] text-[#e5e2e1]">
              <h3 className="text-2xl sm:text-3xl font-headline tracking-wider text-[#f97316] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 uppercase">
                <RefreshCcw size={26} className="text-[#f97316]" />
                Avail Membership
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Plan Selection */}
                <div className="flex flex-col">
                  <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                    Select Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={renewPlan}
                    onChange={(e) => setRenewPlan(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border-[#2A2A2A] text-sm sm:text-base text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer"
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
                  <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                    Payment Option <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentOption}
                    onChange={(e) => setPaymentOption(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border-[#2A2A2A] text-sm sm:text-base text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer"
                  >
                    <option value="One Time">One Time</option>
                    <option value="Installment">Installment</option>
                  </select>
                </div>

                {/* Custom plan fields */}
                {renewPlan === "Custom" && (
                  <>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
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
                        className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                        Validity Type
                      </label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border-[#2A2A2A] text-sm sm:text-base text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer"
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
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-1">
                        Amount Paid (₹)
                      </label>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={useDefaultPrice}
                          onChange={(e) => setUseDefaultPrice(e.target.checked)}
                          className="accent-[#f97316]"
                        />
                        <span className="text-zinc-400">
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
                          className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base opacity-60"
                        />
                      ) : (
                        <input
                          type="number"
                          placeholder="Enter custom price"
                          value={customPrice}
                          onChange={(e) =>
                            setCustomPrice(Number(e.target.value))
                          }
                          className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                        />
                      )}
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
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
                          className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                          Payment Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={renewMode}
                          onChange={(e) => setRenewMode(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border-[#2A2A2A] text-sm sm:text-base text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer"
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
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-1">
                        Actual Amount (₹)
                      </label>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <input
                          type="checkbox"
                          checked={useDefaultPrice}
                          onChange={(e) => setUseDefaultPrice(e.target.checked)}
                          className="accent-[#f97316]"
                        />
                        <span className="text-zinc-400">
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
                          className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base opacity-60"
                        />
                      ) : (
                        <input
                          type="number"
                          placeholder="Enter custom actual amount"
                          value={actualAmount}
                          onChange={(e) =>
                            setActualAmount(Number(e.target.value))
                          }
                          className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                        />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                        Installment Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={installmentFee}
                        onChange={(e) =>
                          setInstallmentFee(Number(e.target.value))
                        }
                        placeholder="Enter extra fee"
                        className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                        Amount Paid (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                        className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
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
                        className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base opacity-60"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                      />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
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
                          className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2">
                          Payment Mode <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={renewMode}
                          onChange={(e) => setRenewMode(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border-[#2A2A2A] text-sm sm:text-base text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer"
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
                  className="btn-primary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
                >
                  Confirm Renewal
                </button>
                <button
                  onClick={() => setShowRenewModal(false)}
                  className="btn-secondary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full mx-3 shadow-2xl border-[#2A2A2A] text-[#e5e2e1]">
            <h3 className="text-2xl sm:text-3xl font-headline tracking-wider text-[#f97316] mb-4 sm:mb-6 text-center uppercase">
              Pay Remaining Amount
            </h3>

            <div className="space-y-4 sm:space-y-5 text-left">
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Remaining Amount
                </label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Mode of Payment
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#050505] border-[#2A2A2A] text-sm sm:text-base text-[#e5e2e1] focus:border-[#f97316] outline-none cursor-pointer"
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
                className="btn-primary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
              >
                Confirm Payment
              </button>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setPayMode("");
                  setPayAmount("");
                }}
                className="btn-secondary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full mx-3 shadow-2xl border-[#2A2A2A] text-[#e5e2e1] text-center">
            <h3 className="text-2xl sm:text-3xl font-headline tracking-wider text-red-500 mb-4 sm:mb-6 flex items-center justify-center gap-2 sm:gap-3 uppercase">
              <Trash2 size={24} className="text-red-500" />
              Delete Member
            </h3>
            <p className="text-zinc-300 mb-5 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#e5e2e1]">{member.name}</strong>?
            </p>
            <div className="flex justify-center gap-3 sm:gap-4">
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
                      setTimeout(() => router.push(`/${tenantSlug}/members`), 2000);
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
                className="bg-red-650 text-white px-5 sm:px-6 py-2.5 rounded-xl hover:bg-red-700 transition font-headline text-xl tracking-wider shadow cursor-pointer"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary px-5 sm:px-6 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div
            className={`p-5 sm:p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full mx-4 transition-all
        ${
          showFeedbackModal.type === "success"
            ? "bg-green-950/20 text-[#22c55e] border border-[#22c55e]/25 backdrop-blur-md"
            : "bg-red-950/20 text-red-400 border border-red-500/25 backdrop-blur-md"
        }`}
          >
            <h3 className="text-xl sm:text-2xl font-headline tracking-wider mb-2">
              {showFeedbackModal.type === "success" ? "✅ Success" : "❌ Error"}
            </h3>
            <p className="text-sm sm:text-lg">{showFeedbackModal.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
