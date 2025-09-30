"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard,
  UserCircle,
  RefreshCcw,
  Trash2,
  PlusCircle,
  Camera,
} from "lucide-react";
import ImageCropper from "@/components/ImageCropper";

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
  const [coach, setCoach] = useState<Coach | null>(null);

  // Salary modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number | "">("");
  const [payDate, setPayDate] = useState("");
  const [payMode, setPayMode] = useState("Cash");

  // Profile picture states
  const [newProfilePicture, setNewProfilePicture] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");

  const openEditModal = () => {
    if (!coach) return;
    setEditName(coach.name);
    setEditMobile(coach.mobile);
    setEditEmail(coach.email || "");
    setEditStatus(coach.status || "Active");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    // Simple validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobileRegex = /^\d{10}$/;

    if (!editName.trim()) {
      alert("Name cannot be empty");
      return;
    }
    if (!mobileRegex.test(editMobile)) {
      alert("Mobile number must be 10 digits");
      return;
    }
    if (editEmail && !emailRegex.test(editEmail)) {
      alert("Invalid email address");
      return;
    }

    try {
      const res = await fetch(`/api/coach/${coach!._id}`, {
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
      } else {
        alert("Failed to update coach details");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update coach details");
    }
  };

  useEffect(() => {
    fetch(`/api/coach/${params.id}`)
      .then((res) => res.json())
      .then((data) => data.success && setCoach(data.coach));
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
    setNewProfilePicture(croppedBase64);
    setUploading(true);

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
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!coach)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-xl animate-pulse">
          Loading coach profile...
        </p>
      </div>
    );

  const handlePaySalary = async () => {
    if (!payAmount || !payDate || !payMode) {
      alert("Please fill all fields");
      return;
    }
    try {
      const res = await fetch(`/api/coach/${coach._id}/salary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: payAmount,
          paidOn: payDate,
          modeOfPayment: payMode,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCoach(updated.coach);
        setShowPayModal(false);
        setPayAmount("");
        setPayDate("");
        setPayMode("Cash");
      } else alert("Failed to pay salary");
    } catch (err) {
      console.error(err);
      alert("Failed to pay salary");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E9ECEF] via-[#F8F9FA] to-white p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <h1 className="flex items-center gap-4 text-[48px] font-extrabold text-[#0A2463]">
          <UserCircle size={48} className="text-[#FFC107]" /> Coach Profile
        </h1>
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={() => setShowPayModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-[#FFC107] text-[#0A2463] font-semibold rounded-lg shadow hover:bg-[#e0a800] transition"
          >
            <PlusCircle size={22} /> Pay Salary
          </button>

          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            <CreditCard size={22} /> Edit
          </button>

          <button
            onClick={() => alert("Delete functionality here")}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
          >
            <Trash2 size={22} /> Delete
          </button>
        </div>
      </div>

      {/* Coach Card */}
      <div className="bg-white rounded-3xl p-10 max-w-4xl mx-auto shadow-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-10 items-center">
          {/* Profile Picture */}
          <div className="relative w-40 h-40">
            {newProfilePicture || coach.profilePicture ? (
              <img
                src={newProfilePicture || coach.profilePicture!}
                alt={coach.name}
                className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-[#FFC107] cursor-pointer"
                onClick={() => setShowLightbox(true)}
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-[#FFC107] flex items-center justify-center text-white text-5xl font-bold shadow-md">
                {getInitials(coach.name)}
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

          {/* Coach Details */}
          <div className="flex-1 space-y-4 text-[#212529] text-2xl">
            <p className="flex items-center gap-3">
              <CreditCard size={24} className="text-green-600" />
              <strong>Mobile:</strong> {coach.mobile}
            </p>
            {coach.email && (
              <p className="flex items-center gap-3">
                <CreditCard size={24} className="text-blue-600" />
                <strong>Email:</strong> {coach.email}
              </p>
            )}
            <p className="flex items-center gap-3">
              <CreditCard size={24} className="text-purple-600" />
              <strong>Join Date:</strong>{" "}
              {(coach as any).joinDate
                ? new Date((coach as any).joinDate).toLocaleDateString("en-GB")
                : "N/A"}
            </p>

            {/* ✅ Status Toggle */}
            <div className="flex items-center gap-3 mt-2">
              <CreditCard size={20} className="text-orange-600" />
              <strong>Status:</strong>

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
                        alert("Failed to update status");
                      }
                    } else {
                      alert("Failed to update status");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("Failed to update status");
                  }
                }}
                className={`ml-2 w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                  coach.status === "Active"
                    ? "bg-green-400 justify-end"
                    : "bg-red-400 justify-start"
                }`}
              >
                <span className="w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300"></span>
              </button>

              <span
                className={`ml-3 font-semibold text-lg ${
                  coach.status === "Active" ? "text-green-600" : "text-red-600"
                }`}
              >
                {coach.status || "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (newProfilePicture || coach.profilePicture) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in"
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={newProfilePicture || coach.profilePicture!}
            alt={coach.name}
            className="max-h-[80vh] max-w-[80vw] rounded-xl shadow-2xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Salary History */}
      <div className="bg-white rounded-3xl p-10 max-w-5xl mx-auto shadow-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-bold text-[#0A2463] flex items-center gap-2">
            <CreditCard size={30} className="text-[#FFC107]" /> Salary History
          </h3>
        </div>

        {coach.salaryHistory && coach.salaryHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow-md">
              <thead className="bg-[#FFC107] text-[#0A2463] uppercase text-[19px] tracking-wider">
                <tr>
                  <th className="text-center px-6 py-3">#</th>
                  <th className="text-center px-6 py-3">Amount (₹)</th>
                  <th className="text-center px-6 py-3">Paid On</th>
                </tr>
              </thead>
              <tbody>
                {coach.salaryHistory
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
                      } hover:bg-gray-100 text-[18px]`}
                    >
                      <td className="px-6 py-4 font-medium text-center">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4 text-green-600 font-semibold text-center">
                        ₹{s.amountPaid}
                      </td>
                      <td className="px-6 py-4 text-gray-800 text-center">
                        {new Date(s.paidOn).toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">
            No salary records found.
          </p>
        )}
      </div>

      {/* Pay Salary Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-10 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-3xl font-bold text-[#0A2463] mb-6 flex items-center gap-3">
              <RefreshCcw size={28} className="text-[#FFC107]" />
              Pay Salary
            </h3>

            <div className="flex flex-col gap-6">
              <input
                type="number"
                placeholder="Amount (₹)"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
              />
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
              />

              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={handlePaySalary}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow"
                >
                  Pay
                </button>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white p-10 rounded-3xl max-w-md w-full shadow-2xl border border-gray-200">
            <h3 className="text-3xl font-bold text-[#0A2463] mb-6 flex items-center gap-3">
              <CreditCard size={28} className="text-[#FFC107]" />
              Edit Coach
            </h3>

            <div className="flex flex-col gap-6">
              <input
                type="text"
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
              />
              <input
                type="text"
                placeholder="Mobile"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  editMobile && !/^\d{10}$/.test(editMobile)
                    ? "border-red-500"
                    : "border-gray-300"
                } bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]`}
              />

              <input
                type="email"
                placeholder="Email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border ${
                  editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)
                    ? "border-red-500"
                    : "border-gray-300"
                } bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]`}
              />
              <input
                type="text"
                value={(coach as any).joinDate || ""}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <select
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as "Active" | "Inactive")
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#0A2463] focus:ring-2 focus:ring-[#FFC107]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={handleSaveEdit}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition font-semibold shadow"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition font-semibold shadow"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
