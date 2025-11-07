"use client";

import React from "react";

export default function Loader({
  text = "Loading workout data...",
}: {
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] animate-fadeIn space-y-8 bg-gradient-to-b from-[#E9ECEF] via-[#F8F9FA] to-white rounded-2xl p-10">
      {/* Barbell Loader */}
      <div className="relative w-40 h-3 bg-[#0A2463] rounded-full overflow-hidden shadow-md animate-pulseBarbell">
        {/* Left weight */}
        <div className="absolute left-[-25px] top-[-10px] w-8 h-8 bg-[#FFC107] rounded-full shadow-lg animate-weightMove" />
        {/* Right weight */}
        <div className="absolute right-[-25px] top-[-10px] w-8 h-8 bg-[#FFC107] rounded-full shadow-lg animate-weightMove delay-150" />
        {/* Barbell glow */}
        <div className="absolute inset-0 bg-[#0A2463]/30 blur-md rounded-full animate-glowBarbell" />
      </div>

      {/* Optional Dumbbell Icon Animation */}
      <div className="relative w-16 h-16 flex items-center justify-center animate-bounceDumbbell">
        <div className="absolute w-4 h-4 bg-[#0A2463] rounded-full left-0" />
        <div className="absolute w-4 h-4 bg-[#0A2463] rounded-full right-0" />
        <div className="absolute w-8 h-2 bg-[#0A2463] rounded-sm" />
      </div>

      {/* Text */}
      <p className="text-[#0A2463] text-lg font-bold tracking-wide animate-pulse">
        {text}
      </p>
    </div>
  );
}
