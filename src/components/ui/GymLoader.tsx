"use client";

import { useGym } from "@/context/GymContext";

interface GymLoaderProps {
  message?: string;
}

export default function GymLoader({ message }: GymLoaderProps) {
  const { gym } = useGym();

  const primaryColor = gym?.primaryColor || "#f97316";
  const gymName = gym?.name;
  const gymLogo = gym?.logo;

  // Derive initials for fallback avatar
  const initials = gymName
    ? gymName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in"
      aria-label="Loading"
      role="status"
    >
      {/* Centered Card */}
      <div className="flex flex-col items-center gap-6">
        {/* Logo with spinner rings */}
        <div className="relative flex items-center justify-center">
          {/* Outer slow-pulse glow */}
          <span
            className="absolute rounded-full animate-ping"
            style={{
              width: 84,
              height: 84,
              background: primaryColor,
              opacity: 0.15,
            }}
          />
          {/* Rotating border ring */}
          <span
            className="absolute rounded-full border-[3px] border-t-transparent animate-spin"
            style={{
              width: 96,
              height: 96,
              borderColor: primaryColor,
              borderTopColor: "transparent",
            }}
          />
          {/* Inner slow counter-spin ring */}
          <span
            className="absolute rounded-full border-[1.5px] border-b-transparent animate-spin"
            style={{
              width: 78,
              height: 78,
              borderColor: `${primaryColor}60`,
              borderBottomColor: "transparent",
              animationDuration: "1.8s",
              animationDirection: "reverse",
            }}
          />

          {/* Logo or Initials */}
          {gymLogo ? (
            <img
              src={gymLogo}
              alt={gymName || "Gym"}
              className="w-16 h-16 rounded-full object-cover z-10 relative border-2"
              style={{ borderColor: `${primaryColor}40` }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full z-10 relative flex items-center justify-center border-2"
              style={{
                background: `${primaryColor}18`,
                borderColor: `${primaryColor}35`,
              }}
            >
              {initials ? (
                <span
                  className="font-bold text-2xl font-sans"
                  style={{ color: primaryColor }}
                >
                  {initials}
                </span>
              ) : (
                <span className="text-2xl" style={{ color: primaryColor }}>
                  ⚡
                </span>
              )}
            </div>
          )}
        </div>

        {/* Gym name */}
        {gymName && (
          <div className="flex flex-col items-center gap-1 text-center">
            <span
              className="text-lg font-bold tracking-widest uppercase"
              style={{ color: primaryColor }}
            >
              {gymName}
            </span>
            <span className="text-xs text-zinc-500 tracking-widest uppercase">
              {message || "Loading..."}
            </span>
          </div>
        )}

        {/* Fallback if no gym loaded yet */}
        {!gymName && (
          <span className="text-xs text-zinc-600 tracking-widest uppercase">
            {message || "Loading..."}
          </span>
        )}

        {/* Thin progress bar */}
        <div className="w-40 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full animate-progress-bar"
            style={{ background: primaryColor }}
          />
        </div>
      </div>
    </div>
  );
}
