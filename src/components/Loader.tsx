"use client";

import React from "react";

export default function Loader({
  text = "Loading data...",
}: {
  text?: string;
}) {
  return (
    <div
      className="
        flex flex-col items-center justify-center 
        min-h-[180px] sm:min-h-[220px] md:min-h-[250px] 
        animate-fadeIn space-y-6 sm:space-y-8 
        bg-gradient-to-b from-[#E9ECEF] via-[#F8F9FA] to-white 
        rounded-2xl p-6 sm:p-10
      "
    >
      {/* Barbell Loader */}
      <div
        className="
          relative 
          w-28 h-2 sm:w-36 sm:h-3 md:w-40 md:h-3 
          bg-[#0A2463] rounded-full overflow-hidden 
          shadow-md animate-pulseBarbell
        "
      >
        {/* Left weight */}
        <div
          className="
            absolute 
            left-[-15px] sm:left-[-20px] md:left-[-25px]  
            top-[-8px] sm:top-[-10px] 
            w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 
            bg-[#FFC107] rounded-full shadow-lg 
            animate-weightMove
          "
        />

        {/* Right weight */}
        <div
          className="
            absolute 
            right-[-15px] sm:right-[-20px] md:right-[-25px]  
            top-[-8px] sm:top-[-10px] 
            w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 
            bg-[#FFC107] rounded-full shadow-lg 
            animate-weightMove delay-150
          "
        />

        {/* Barbell glow */}
        <div className="absolute inset-0 bg-[#0A2463]/30 blur-md rounded-full animate-glowBarbell" />
      </div>

      {/* Dumbbell Icon */}
      <div
        className="
          relative 
          w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 
          flex items-center justify-center 
          animate-bounceDumbbell
        "
      >
        <div className="absolute w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-[#0A2463] rounded-full left-0" />
        <div className="absolute w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-[#0A2463] rounded-full right-0" />
        <div className="absolute w-5 h-1 sm:w-7 sm:h-1.5 md:w-8 md:h-2 bg-[#0A2463] rounded-sm" />
      </div>

      {/* Loading Text */}
      <p
        className="
          text-[#0A2463] 
          text-sm sm:text-base md:text-lg 
          font-bold tracking-wide animate-pulse
        "
      >
        {text}
      </p>
    </div>
  );
}
