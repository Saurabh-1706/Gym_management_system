"use client";

import { useGym } from "@/context/GymContext";

interface GymLogoProps {
  showName?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function GymLogo({ showName = true, size = "md" }: GymLogoProps) {
  const { gym, loading } = useGym();

  const sizeClasses = {
    sm: { avatar: "w-8 h-8", text: "text-sm", name: "text-sm", initials: "text-xs" },
    md: { avatar: "w-10 h-10", text: "text-base", name: "text-base", initials: "text-sm" },
    lg: { avatar: "w-14 h-14", text: "text-xl", name: "text-xl", initials: "text-lg" },
  };

  const s = sizeClasses[size];
  const primaryColor = gym?.primaryColor || "#f97316";

  // Derive initials from gym name
  const initials = gym?.name
    ? gym.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : "GY";

  if (loading) {
    return (
      <div className="flex items-center gap-3 animate-pulse">
        <div className={`${s.avatar} rounded-full bg-white/10`} />
        {showName && <div className="h-4 w-28 rounded bg-white/10" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Logo or Initials Avatar */}
      {gym?.logo ? (
        <img
          src={gym.logo}
          alt={gym.name}
          className={`${s.avatar} rounded-full object-cover border-2 flex-shrink-0`}
          style={{ borderColor: `${primaryColor}50` }}
        />
      ) : (
        <div
          className={`${s.avatar} rounded-full flex items-center justify-center flex-shrink-0 border-2 font-bold`}
          style={{
            background: `${primaryColor}18`,
            borderColor: `${primaryColor}35`,
            color: primaryColor,
          }}
        >
          <span className={s.initials}>{initials}</span>
        </div>
      )}

      {/* Gym Name */}
      {showName && (
        <div className="flex flex-col leading-tight overflow-hidden">
          <span
            className={`${s.name} font-bold tracking-wide truncate max-w-[160px]`}
            style={{ color: primaryColor }}
          >
            {gym?.name || "My Gym"}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">
            Gym Portal
          </span>
        </div>
      )}
    </div>
  );
}
