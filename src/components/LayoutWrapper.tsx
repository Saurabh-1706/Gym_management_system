"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/login";

  return (
    <div className="flex min-h-screen bg-[#E9ECEF]">
      {!hideNavbar && <Navbar />}
      <main
        className={`flex-1 ${
          !hideNavbar ? "ml-72 p-6 bg-[#E9ECEF]" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
