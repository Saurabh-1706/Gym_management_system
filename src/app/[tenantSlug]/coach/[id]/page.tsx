"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CreditCard,
  UserCircle,
  RefreshCcw,
  Trash2,
  PlusCircle,
  Camera,
  FolderOpen, // ⬅️ add this
} from "lucide-react";

import ImageCropper from "@/components/ImageCropper";
import Loader from "@/components/Loader";

type Salary = { amountPaid: number; paidOn: string; modeOfPayment?: string };

type Coach = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  profilePicture?: string;
  status?: "Active" | "Inactive";
  salaryHistory?: Salary[];
};

export default function CoachProfile() {
  const params = useParams();
  const tenantSlug = params.tenantSlug;
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payDate, setPayDate] = useState("");
  const [payMode, setPayMode] = useState("Cash");

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");

  const showSuccess = (msg: string) => setPopupMessage(`✅ ${msg}`);
  const showError = (msg: string) => setPopupMessage(`❌ ${msg}`);

  const openEditModal = () => {
    if (!coach) return;
    setEditName(coach.name);
    setEditMobile(coach.mobile);
    setEditEmail(coach.email || "");
    setEditStatus(coach.status || "Active");
    setShowEditModal(true);
  };

  useEffect(() => {
    const fetchCoach = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/coach/${params.id}`);
        const data = await res.json();
        if (data.success) setCoach(data.coach);
        else showError("Failed to load coach details");
      } catch {
        showError("Error loading coach details");
      } finally {
        setLoading(false);
      }
    };
    fetchCoach();
  }, [params.id]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2);

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
    if (!coach) return;
    setShowCropper(false);
    setUploading(true);
    setProcessing(true);

    try {
      const res = await fetch(`/api/coach/${coach._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePicture: croppedBase64 }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCoach(updated.coach);
        setUploadSuccess(true);
        showSuccess("Profile picture updated successfully!");
        setTimeout(() => setUploadSuccess(false), 2000);
      } else showError("Failed to update profile picture");
    } catch {
      showError("Error uploading profile picture");
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!coach) return;
    setProcessing(true);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;

    if (!editName.trim()) {
      showError("Name cannot be empty");
      setProcessing(false);
      return;
    }
    if (!mobileRegex.test(editMobile)) {
      showError("Mobile must be 10 digits");
      setProcessing(false);
      return;
    }
    if (editEmail && !emailRegex.test(editEmail)) {
      showError("Invalid email address");
      setProcessing(false);
      return;
    }

    try {
      const res = await fetch(`/api/coach/${coach._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          email: editEmail,
          status: editStatus,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCoach(updated.coach);
        setShowEditModal(false);
        showSuccess("Coach details updated successfully!");
      } else {
        showError("Failed to update coach details");
      }
    } catch {
      showError("Error updating coach details");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaySalary = async () => {
    if (!coach) return;
    if (!payAmount || !payDate)
      return showError("Please fill all salary fields");
    setProcessing(true);

    try {
      const res = await fetch(`/api/coach/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId: coach._id,
          amount: payAmount,
          date: payDate,
          modeOfPayment: payMode,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setCoach(updated.coach);
        setShowPayModal(false);
        showSuccess("Salary paid successfully!");
      } else showError("Failed to pay salary");
    } catch {
      showError("Error processing salary payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCoach = async () => {
    if (!coach) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/coach/${coach._id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess("Coach deleted successfully!");
        setShowDeleteConfirm(false);
        setTimeout(() => router.push(`/${tenantSlug}/coach`), 1500);
      } else showError("Failed to delete coach");
    } catch {
      showError("Error deleting coach");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] text-[#e5e2e1]">
        <Loader text="Loading coach profile..." />
      </div>
    );
  }

  if (!coach) return null;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#e5e2e1] px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-body">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 shadow-md">
            <UserCircle size={24} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider text-[#f97316] leading-tight uppercase">
              Coach Profile
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              View and manage salary, status and personal details.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowPayModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm sm:text-base font-headline tracking-wider text-white shadow cursor-pointer uppercase"
          >
            <PlusCircle size={18} /> Pay Salary
          </button>

          <button
            onClick={openEditModal}
            className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-lg text-sm sm:text-base font-headline tracking-wider text-white shadow cursor-pointer uppercase"
          >
            Edit Info
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-950/40 text-red-400 border border-red-500/25 px-4 py-2 rounded-xl hover:bg-red-900/20 hover:text-red-300 transition text-sm sm:text-base font-headline tracking-wider cursor-pointer uppercase"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Coach card */}
      <div className="max-w-6xl mx-auto glass-card border-[#2A2A2A] shadow-md px-4 sm:px-6 lg:px-8 py-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-start">
          {/* Profile pic */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 flex-shrink-0">
            {coach.profilePicture ? (
              <img
                src={coach.profilePicture}
                alt={coach.name}
                className="w-full h-full rounded-full object-cover shadow-md border-4 border-[#f97316]/50 cursor-pointer"
                onClick={() => setShowLightbox(true)}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#f97316]/10 border border-[#f97316]/20 flex items-center justify-center text-[#f97316] text-3xl sm:text-4xl lg:text-5xl font-headline tracking-wider shadow-md">
                {getInitials(coach.name)}
              </div>
            )}

            {/* Browse from files */}
            <label className="absolute bottom-1 left-1 bg-zinc-800 border border-zinc-700 p-2 rounded-full shadow cursor-pointer hover:bg-zinc-700">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
              <FolderOpen size={18} className="text-white" />
            </label>

            {/* Capture from camera */}
            <label className="absolute bottom-1 right-1 bg-zinc-800 border border-zinc-700 p-2 rounded-full shadow cursor-pointer hover:bg-zinc-700">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
              <Camera size={18} className="text-white" />
            </label>

            {uploading && (
              <span className="absolute -bottom-6 left-0 right-0 text-center text-xs text-blue-400 font-semibold">
                Uploading...
              </span>
            )}
            {uploadSuccess && (
              <span className="absolute -bottom-6 left-0 right-0 text-center text-xs text-[#22c55e] font-semibold">
                Saved ✔
              </span>
            )}

            {showCropper && selectedFile && (
              <ImageCropper
                file={selectedFile}
                onComplete={handleCropComplete}
                onCancel={() => setShowCropper(false)}
              />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 w-full space-y-3.5 text-sm sm:text-base text-zinc-300 text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-headline tracking-wider text-white">
              {coach.name}
            </h2>

            <p className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/5 px-2.5 py-1 text-xs font-semibold text-[#e0c0b1] uppercase tracking-wider">
                <CreditCard size={14} className="text-[#22c55e] mr-1.5" />
                Mobile:
              </span>
              <span className="font-medium text-[#e5e2e1]">{coach.mobile}</span>
            </p>

            {coach.email && (
              <p className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/5 px-2.5 py-1 text-xs font-semibold text-[#e0c0b1] uppercase tracking-wider">
                  <CreditCard size={14} className="text-blue-450 mr-1.5" />
                  Email:
                </span>
                <span className="font-medium text-[#e5e2e1] break-all">{coach.email}</span>
              </p>
            )}

            <p className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/5 px-2.5 py-1 text-xs font-semibold text-[#e0c0b1] uppercase tracking-wider">
                <CreditCard size={14} className="text-purple-450 mr-1.5" />
                Join Date:
              </span>
              <span className="font-medium text-[#e5e2e1]">
                {(coach as any).joinDate
                  ? new Date((coach as any).joinDate).toLocaleDateString(
                      "en-GB"
                    )
                  : "N/A"}
              </span>
            </p>

            {/* Status toggle */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/5 px-2.5 py-1 text-xs font-semibold text-[#e0c0b1] uppercase tracking-wider">
                <CreditCard size={14} className="text-orange-450 mr-1.5" />
                Status:
              </span>

              <button
                onClick={async () => {
                  if (!coach) return;
                  const newStatus =
                    coach.status === "Active" ? "Inactive" : "Active";

                  try {
                    const res = await fetch(`/api/coach/${coach._id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: newStatus }),
                    });

                    if (res.ok) {
                      const data = await res.json();
                      if (data.success) {
                        setCoach((prev) =>
                          prev ? { ...prev, status: newStatus } : prev
                        );
                      } else {
                        showError("Failed to update status");
                      }
                    } else {
                      showError("Failed to update status");
                    }
                  } catch (err) {
                    console.error(err);
                    showError("Failed to update status");
                  }
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                  coach.status === "Active"
                    ? "bg-[#22c55e] justify-end"
                    : "bg-red-500 justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300" />
              </button>

              <span
                className={`font-semibold text-sm sm:text-base ${
                  coach.status === "Active" ? "text-[#22c55e]" : "text-red-400"
                }`}
              >
                {coach.status || "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary history */}
      <div className="max-w-6xl mx-auto glass-card border-[#2A2A2A] shadow-md px-4 sm:px-6 lg:px-8 py-6 text-left">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-headline tracking-wider text-[#f97316] uppercase flex items-center gap-2">
            <CreditCard size={26} className="text-[#f97316]" />
            Salary History
          </h3>
        </div>

        {coach.salaryHistory && coach.salaryHistory.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <div className="rounded-xl border-[#2A2A2A] overflow-hidden bg-[#0A0A0A]">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead className="table-thead">
              <tr>
                    <th className="px-6 py-3.5">#</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Amount (₹)</th>
                    <th className="px-6 py-3.5 whitespace-nowrap">Paid On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {coach.salaryHistory
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.paidOn).getTime() -
                        new Date(a.paidOn).getTime()
                    )
                    .map((s, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-white/5 transition"
                      >
                        <td className="px-6 py-3.5 text-zinc-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-3.5 text-[#22c55e] font-semibold whitespace-nowrap">
                          ₹{s.amountPaid.toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-3.5 text-zinc-400 whitespace-nowrap">
                          {new Date(s.paidOn).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 text-center py-6 text-sm sm:text-base font-medium">
            No salary records found.
          </p>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && coach.profilePicture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={coach.profilePicture}
            alt={coach.name}
            className="max-h-[85vh] max-w-[85vw] rounded-xl shadow-2xl border border-zinc-700/50"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl border-[#2A2A2A] text-left">
            <h3 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-5 flex items-center gap-3 uppercase">
              <RefreshCcw size={22} className="text-[#f97316]" />
              Pay Salary
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  placeholder="Amount"
                  value={payAmount}
                  onChange={(e) =>
                    setPayAmount(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base text-[#e5e2e1]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Mode of Payment
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base cursor-pointer text-[#e5e2e1]"
                >
                  <option value="Cash" className="bg-[#121212]">Cash</option>
                  <option value="UPI" className="bg-[#121212]">UPI</option>
                  <option value="Bank Transfer" className="bg-[#121212]">Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 mt-6">
                <button
                  onClick={handlePaySalary}
                  className="btn-primary px-5 sm:px-7 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  Pay
                </button>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="btn-secondary px-5 sm:px-7 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coach Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60 px-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full shadow-2xl border-[#2A2A2A] text-left">
            <h3 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-5 flex items-center gap-3 uppercase">
              <CreditCard size={22} className="text-[#f97316]" />
              Edit Coach Info
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Contact No.
                </label>
                <input
                  type="text"
                  placeholder="Mobile"
                  value={editMobile}
                  onChange={(e) => setEditMobile(e.target.value)}
                  className={`input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base ${
                    editMobile && !/^\d{10}$/.test(editMobile) ? "border-red-500" : ""
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className={`input-dark w-full px-4 py-2.5 rounded-xl text-sm sm:text-base ${
                    editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail) ? "border-red-500" : ""
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Join Date
                </label>
                <input
                  type="text"
                  value={(coach as any).joinDate ? new Date((coach as any).joinDate).toLocaleDateString("en-GB") : ""}
                  disabled
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base text-zinc-500 cursor-not-allowed opacity-60"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#e0c0b1] uppercase tracking-widest mb-2 block ml-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as "Active" | "Inactive")
                  }
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm sm:text-base cursor-pointer text-[#e5e2e1]"
                >
                  <option value="Active" className="bg-[#121212]">Active</option>
                  <option value="Inactive" className="bg-[#121212]">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary px-5 sm:px-7 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary px-5 sm:px-7 py-2.5 rounded-lg font-headline text-xl tracking-wider text-white shadow cursor-pointer uppercase"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-3">
          <div className="glass-card rounded-xl p-6 sm:p-8 shadow-xl max-w-md w-full border-[#2A2A2A] text-center text-[#e5e2e1]">
            <h2 className="text-xl sm:text-2xl font-headline tracking-wider text-[#f97316] mb-3 uppercase">
              Confirm Deletion
            </h2>
            <p className="text-zinc-300 text-sm sm:text-base mb-6">
              Are you sure you want to delete <strong>{coach?.name}</strong>?
            </p>
            <div className="flex justify-center gap-3 sm:gap-6">
              <button
                onClick={handleDeleteCoach}
                className="btn-primary px-5 py-2 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer uppercase"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary px-5 py-2 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup message */}
      {popupMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/60 px-3">
          <div className="glass-card px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl text-center max-w-sm w-full border-[#2A2A2A] text-[#e5e2e1]">
            <p className="text-lg font-headline tracking-wider mb-4 whitespace-pre-line">
              {popupMessage}
            </p>
            <button
              onClick={() => setPopupMessage(null)}
              className="btn-primary px-6 py-2 rounded-lg font-headline text-lg tracking-wider text-white shadow cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000]">
          <Loader text="Processing..." />
        </div>
      )}
    </div>
  );
}
