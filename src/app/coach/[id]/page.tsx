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
        setTimeout(() => router.push("/coach"), 1500);
      } else showError("Failed to delete coach");
    } catch {
      showError("Error deleting coach");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E9ECEF]">
        <Loader text="Loading coach profile..." />
      </div>
    );
  }

  if (!coach) return null;

  return (
    <div className="min-h-screen bg-[#E9ECEF] px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-[#FFC107] text-white shadow-md">
            <UserCircle size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0A2463] leading-tight">
              Coach Profile
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              View and manage salary, status and personal details.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowPayModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFC107] text-[#0A2463] text-sm sm:text-base font-semibold shadow hover:bg-[#e0a800] transition"
          >
            <PlusCircle size={18} /> Pay Salary
          </button>

          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm sm:text-base shadow hover:bg-blue-700 transition"
          >
            <CreditCard size={18} /> Edit
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm sm:text-base shadow hover:bg-red-700 transition"
          >
            <Trash2 size={18} /> Delete
          </button>
        </div>
      </div>

      {/* Coach card */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-md px-4 sm:px-6 lg:px-8 py-5 sm:py-7 mb-5 sm:mb-7">
        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-center md:items-start">
          {/* Profile pic */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 flex-shrink-0">
            {coach.profilePicture ? (
              <img
                src={coach.profilePicture}
                alt={coach.name}
                className="w-full h-full rounded-full object-cover shadow-md border-4 border-[#FFC107] cursor-pointer"
                onClick={() => setShowLightbox(true)}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#FFC107] flex items-center justify-center text-white text-3xl sm:text-4xl lg:text-5xl font-bold shadow-md">
                {getInitials(coach.name)}
              </div>
            )}

            {/* 🗂 Browse from files */}
            <label className="absolute bottom-1 left-1 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
              <FolderOpen size={20} className="text-[#0A2463]" />
            </label>

            {/* 📷 Capture from camera */}
            <label className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow cursor-pointer hover:bg-gray-100">
              <input
                type="file"
                accept="image/*"
                capture="environment" // ⬅️ opens camera on most mobiles
                className="hidden"
                onChange={handleProfilePictureChange}
              />
              <Camera size={20} className="text-[#0A2463]" />
            </label>

            {uploading && (
              <span className="absolute -bottom-6 left-0 text-xs sm:text-sm text-blue-600 font-semibold">
                Uploading...
              </span>
            )}
            {uploadSuccess && (
              <span className="absolute -bottom-6 left-0 text-xs sm:text-sm text-green-600 font-semibold">
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
          <div className="flex-1 w-full space-y-3 sm:space-y-4 text-sm sm:text-base text-[#212529]">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0A2463]">
              {coach.name}
            </h2>

            <p className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-lg bg-[#E9ECEF] px-2.5 py-1">
                <CreditCard size={18} className="text-green-600 mr-1.5" />
                <span className="font-semibold text-gray-800">Mobile:</span>
              </span>
              <span className="font-medium">{coach.mobile}</span>
            </p>

            {coach.email && (
              <p className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-lg bg-[#E9ECEF] px-2.5 py-1">
                  <CreditCard size={18} className="text-blue-600 mr-1.5" />
                  <span className="font-semibold text-gray-800">Email:</span>
                </span>
                <span className="font-medium break-all">{coach.email}</span>
              </p>
            )}

            <p className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-lg bg-[#E9ECEF] px-2.5 py-1">
                <CreditCard size={18} className="text-purple-600 mr-1.5" />
                <span className="font-semibold text-gray-800">Join Date:</span>
              </span>
              <span className="font-medium">
                {(coach as any).joinDate
                  ? new Date((coach as any).joinDate).toLocaleDateString(
                      "en-GB"
                    )
                  : "N/A"}
              </span>
            </p>

            {/* Status toggle */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="inline-flex items-center justify-center rounded-lg bg-[#FFF3CD] px-2.5 py-1">
                <CreditCard size={18} className="text-orange-600 mr-1.5" />
                <span className="font-semibold text-gray-800">Status:</span>
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
                    ? "bg-green-400 justify-end"
                    : "bg-red-400 justify-start"
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300" />
              </button>

              <span
                className={`font-semibold text-sm sm:text-base ${
                  coach.status === "Active" ? "text-green-600" : "text-red-600"
                }`}
              >
                {coach.status || "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary history – tighter + horizontal scroll on mobile */}
      <div className="max-w-6xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-md px-3 sm:px-5 lg:px-8 py-5 sm:py-7">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0A2463] flex items-center gap-2">
            <CreditCard size={26} className="text-[#FFC107]" />
            Salary History
          </h3>
        </div>

        {coach.salaryHistory && coach.salaryHistory.length > 0 ? (
          <div className="w-full overflow-x-auto mx-1 sm:mx-0">
            <div className="table-scroll rounded-2xl border border-slate-100">
              <table className="w-full text-xs sm:text-sm lg:text-base">
                <thead className="bg-[#0A2463] text-white uppercase tracking-wide">
                  <tr>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-center">
                      #
                    </th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-center whitespace-nowrap">
                      Amount (₹)
                    </th>
                    <th className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-center whitespace-nowrap">
                      Paid On
                    </th>
                  </tr>
                </thead>
                <tbody>
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
                        className={`${
                          idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } hover:bg-gray-100`}
                      >
                        <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 font-medium text-center">
                          {idx + 1}
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-green-600 font-semibold text-center whitespace-nowrap">
                          ₹{s.amountPaid}
                        </td>
                        <td className="px-2 sm:px-4 lg:px-6 py-2 sm:py-3 text-gray-800 text-center whitespace-nowrap">
                          {new Date(s.paidOn).toLocaleDateString("en-GB")}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6 text-sm sm:text-base">
            No salary records found.
          </p>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && coach.profilePicture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={coach.profilePicture}
            alt={coach.name}
            className="max-h-[80vh] max-w-[80vw] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Pay Salary Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 px-3">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-4 sm:mb-6 flex items-center gap-3">
              <RefreshCcw size={24} className="text-[#FFC107]" />
              Pay Salary
            </h3>

            <div className="flex flex-col gap-4 sm:gap-5">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={payAmount}
                onChange={(e) =>
                  setPayAmount(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] outline-none"
              />
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] outline-none"
              />

              <select
                value={payMode}
                onChange={(e) => setPayMode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>

              <div className="flex justify-end gap-3 sm:gap-4 mt-2">
                <button
                  onClick={handlePaySalary}
                  className="bg-green-600 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:bg-green-700 transition font-semibold shadow text-sm sm:text-base"
                >
                  Pay
                </button>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 px-3">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-4 sm:mb-6 flex items-center gap-3">
              <CreditCard size={24} className="text-[#FFC107]" />
              Edit Coach
            </h3>

            <div className="flex flex-col gap-4 sm:gap-5">
              <input
                type="text"
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] outline-none"
              />
              <input
                type="text"
                placeholder="Mobile"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  editMobile && !/^\d{10}$/.test(editMobile)
                    ? "border-red-500"
                    : "border-gray-300"
                } bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] outline-none`}
              />
              <input
                type="email"
                placeholder="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border ${
                  editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)
                    ? "border-red-500"
                    : "border-gray-300"
                } bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] outline-none`}
              />
              <input
                type="text"
                value={(coach as any).joinDate || ""}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-xs sm:text-sm text-gray-500 cursor-not-allowed"
              />
              <select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as "Active" | "Inactive")
                }
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm sm:text-base text-[#0A2463] focus:ring-2 focus:ring-[#FFC107] outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <div className="flex justify-end gap-3 sm:gap-4 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-green-600 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:bg-green-700 transition font-semibold shadow text-sm sm:text-base"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-500 text-white px-4 sm:px-6 py-2.5 rounded-xl hover:bg-gray-600 transition font-semibold shadow text-sm sm:text-base"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0A2463] mb-3">
              Confirm Deletion
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-5">
              Are you sure you want to delete <strong>{coach?.name}</strong>?
            </p>
            <div className="flex justify-center gap-3 sm:gap-6">
              <button
                onClick={handleDeleteCoach}
                className="bg-red-600 text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition text-sm sm:text-base"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-400 text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-500 transition text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup message */}
      {popupMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[999] bg-black/40 px-3">
          <div className="bg-white px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl text-center max-w-sm w-full">
            <p className="text-sm sm:text-lg font-semibold text-[#15145a] whitespace-pre-line">
              {popupMessage}
            </p>
            <button
              onClick={() => setPopupMessage(null)}
              className="mt-4 bg-yellow-400 text-[#15145a] px-5 sm:px-6 py-2 rounded-lg font-bold hover:bg-yellow-500 transition text-sm sm:text-base"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <Loader text="Processing..." />
        </div>
      )}
    </div>
  );
}
