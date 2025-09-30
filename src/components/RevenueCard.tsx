"use client";

export default function RevenueCard({ month, year }: { month: number; year: number }) {
  const downloadPDF = () => {
    if (confirm("Do you want to download this month's revenue report?")) {
      window.open(`/api/revenue-pdf?month=${month}&year=${year}`, "_blank");
    }
  };

  return (
    <div
      className="bg-blue-600 p-6 rounded-lg cursor-pointer shadow-md hover:bg-blue-700 transition"
      onClick={downloadPDF}
    >
      <h2 className="text-white text-2xl font-bold">Total Revenue</h2>
    </div>
  );
}
