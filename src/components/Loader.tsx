"use client";

import React from "react";

export default function Loader({ text = "Loading workout data..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] animate-fadeIn space-y-8">
      <div className="relative w-32 h-2 bg-[#0A2463] rounded-full overflow-hidden">
        <div className="absolute left-[-20px] top-[-8px] w-6 h-6 bg-[#0A2463] rounded-full animate-barbell"></div>
        <div className="absolute right-[-20px] top-[-8px] w-6 h-6 bg-[#0A2463] rounded-full animate-barbell delay-150"></div>
      </div>
      <p className="text-[#0A2463] text-lg font-bold tracking-wide animate-pulse">
        {text}
      </p>
    </div>
  );
}
