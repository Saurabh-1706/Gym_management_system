"use client";

import { useEffect, useState } from "react";
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

type Payment = {
  _id?: string;
  plan: string;
  price: number;
  date: string;
  modeOfPayment?: string;
};

type Member = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  date: string;
  plan: string;
  payments?: Payment[];
  profilePicture?: string;
  status?: "Active" | "Inactive"; // ✅ use directly from API
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
    const latest = [...member.payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return new Date(latest.date);
  }
  return new Date(member.date);
}

// Get latest plan
function getLatestPlan(member: Member): string {
  if (member.payments && member.payments.length > 0) {
    const latestPayment = [...member.payments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
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
  const [renewAmount, setRenewAmount] = useState<number | "">("");
  const [renewMode, setRenewMode] = useState("");
  const [renewDate, setRenewDate] = useState("");

  const [customValidity, setCustomValidity] = useState<number | "">("");
  const [customUnit, setCustomUnit] = useState("days");
  const [allPlans, setAllPlans] = useState<string[]>([]);
  const [newProfilePicture, setNewProfilePicture] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false); // ✅ Lightbox state

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowCropper(true); // open cropper modal
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

  // ✅ Get latest join/renewal date
  const getJoinDate = (member: Member) => {
    if (member.payments && member.payments.length > 0) {
      return new Date(member.payments[member.payments.length - 1].date);
    }
    return new Date(member.date);
  };

  // ✅ Expiry calculation based on latest payment
  const calculateExpiryDate = (member: Member) => {
    // Get latest payment if available
    const latestPayment =
      member.payments && member.payments.length > 0
        ? member.payments.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0]
        : null;

    const planStr = latestPayment?.plan || member.plan;
    const startDate = latestPayment
      ? new Date(latestPayment.date)
      : new Date(member.date);

    const match = planStr.match(/(\d+)\s*(day|days|month|months|year|years)/i);

    const expiryDate = new Date(startDate);

    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();

      switch (unit) {
        case "day":
        case "days":
          expiryDate.setDate(expiryDate.getDate() + value);
          break;
        case "month":
        case "months":
          expiryDate.setMonth(expiryDate.getMonth() + value);
          break;
        case "year":
        case "years":
          expiryDate.setFullYear(expiryDate.getFullYear() + value);
          break;
      }
      return expiryDate;
    }

    // fallback for named plans
    switch (planStr.toLowerCase()) {
      case "monthly":
      case "1 month":
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case "quarterly":
      case "3 months":
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case "half yearly":
      case "6 months":
        expiryDate.setMonth(expiryDate.getMonth() + 6);
        break;
      case "yearly":
      case "12 months":
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        expiryDate.setMonth(expiryDate.getMonth() + 1); // default to 1 month
    }

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
          (a: Payment, b: Payment) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
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
        const planNames = Array.isArray(data.plans)
          ? data.plans.map((p: { name: string }) => p.name)
          : [];
        setAllPlans(planNames);
      } catch (err) {
        console.error(err);
        setAllPlans([]);
      }
    };
    fetchPlans();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-[#FFC107] text-xl">
        Loading profile...
      </div>
    );

  if (!member)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-xl">
        Member not found ❌
      </div>
    );

  const joinDate = getLatestJoinDate(member);
  const currentPlan = getLatestPlan(member);

  const handleRenew = async () => {
    let finalPlan = renewPlan;
    if (renewPlan === "Custom") {
      if (!customValidity || !customUnit) {
        alert("Enter validity for custom plan");
        return;
      }
      finalPlan = `Custom(${customValidity} ${customUnit})`;
    }

    if (!finalPlan || !renewAmount || !renewMode) {
      alert("Fill all required fields");
      return;
    }

    try {
      const res = await fetch(`/api/members/${member._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: finalPlan,
          price: Number(renewAmount),
          date: renewDate ? new Date(renewDate) : new Date(),
          modeOfPayment: renewMode,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        const sortedPayments = [...(updated.member.payments || [])].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setMember({ ...updated.member, payments: sortedPayments });
        setShowRenewModal(false);
        setRenewPlan("");
        setRenewAmount("");
        setRenewMode("");
        setCustomValidity("");
        setCustomUnit("days");
      } else alert("Renewal failed");
    } catch (err) {
      console.error(err);
      alert("Renewal failed");
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
              {member.email && (
                <p className="flex items-center gap-3">
                  <Mail size={20} className="text-red-600" />
                  <strong>Email:</strong> {member.email}
                </p>
              )}
              <p className="flex items-center gap-3">
                <Calendar size={20} className="text-blue-600" />
                <strong>Joined:</strong> {joinDate.toLocaleDateString("en-GB")}
              </p>
              <p className="flex items-center gap-3">
                <CreditCard size={20} className="text-green-600" />
                <strong>Current Plan:</strong> {currentPlan}
              </p>
              <p className="flex items-center gap-3 text-[#ff0707] font-semibold">
                <ClockAlert size={20} className="text-red-600" />
                Membership Ends On:
                {calculateExpiryDate(member).toLocaleDateString("en-GB")}
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
                  </tr>
                </thead>
                <tbody>
                  {member.payments
                    ?.sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .map((p, idx) => (
                      <tr
                        key={idx}
                        className={`${
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-gray-100`}
                      >
                        <td className="px-6 py-4 font-medium text-[#0A2463] text-center">
                          {p.plan}
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-600 text-center">
                          ₹{p.price}
                        </td>
                        <td className="px-6 py-4 text-[#212529] text-center">
                          {p.modeOfPayment || "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-center">
                          {new Date(p.date).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))}
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

      {/* Renew Plan Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-10 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-3xl font-bold text-[#0A2463] mb-6 flex items-center gap-3">
              <RefreshCcw size={28} className="text-[#FFC107]" />
              Renew Plan
            </h3>

            <div className="flex flex-col gap-6">
              {/* Select Plan */}
              <div className="flex flex-col">
                <label className="text-[#0A2463] text-lg font-semibold mb-2">
                  Select Plan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={renewPlan}
                  onChange={(e) => setRenewPlan(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                >
                  <option value="" disabled hidden>
                    Select Plan
                  </option>

                  {/* Dynamically show plans from DB */}
                  {allPlans.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}

                  {/* Keep Custom Plan option */}
                  <option value="Custom">Custom Plan</option>
                </select>
              </div>

              {/* Custom Plan Fields */}
              {renewPlan === "Custom" && (
                <div className="flex gap-3">
                  <input
                    type="number"
                    min={1}
                    placeholder="Validity"
                    value={customValidity}
                    onChange={(e) => setCustomValidity(Number(e.target.value))}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              )}

              {/* Enter Amount */}
              <div className="flex flex-col">
                <label className="text-[#0A2463] text-lg font-semibold mb-2">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter Amount"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                />
              </div>

              {/* Date of Renewal */}
              <div className="flex flex-col">
                <label className="text-[#0A2463] text-lg font-semibold mb-2">
                  Renewal Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={renewDate || ""}
                  onChange={(e) => setRenewDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                />
              </div>

              {/* Mode of Payment */}
              <div className="flex flex-col">
                <label className="text-[#0A2463] text-lg font-semibold mb-2">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={renewMode}
                  onChange={(e) => setRenewMode(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] focus:outline-none"
                >
                  <option value="" disabled hidden>
                    Select Payment Mode
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 mt-6">
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
    </div>
  );
}
