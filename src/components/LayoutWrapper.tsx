"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/auth";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Automatically close sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#E9ECEF] relative">
      {/* ===== Sidebar (Navbar) ===== */}
      {!hideNavbar && (
        <>
          <aside
            className={`fixed top-0 left-0 h-full bg-[#0A2463] text-white shadow-lg z-40 transform transition-transform duration-300
              w-72 md:translate-x-0 ${
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            {/* ===== Mobile Header inside sidebar ===== */}
            <div className="flex items-center justify-between px-5 py-4 md:hidden border-b border-gray-600">
              <h2 className="text-lg font-semibold">Gym Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-[#FFC107]/20 rounded-md"
              >
                <X size={24} />
              </button>
            </div>

            {/* ===== Scrollable Sidebar Content ===== */}
            <div className="overflow-y-auto h-[calc(100%-4rem)] md:h-full">
              <Navbar onLinkClick={() => setMobileMenuOpen(false)} />
            </div>
          </aside>

          {/* ===== Overlay (appears behind sidebar) ===== */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            ></div>
          )}
        </>
      )}

      {/* ===== Main Content Section ===== */}
      <div className="flex flex-col flex-1 min-h-screen md:ml-72 relative">
        {/* ===== Mobile Header (Top Bar) ===== */}
        {!hideNavbar && (
          <header
            className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 flex items-center justify-between 
            px-5 py-3 md:hidden border-b border-gray-200"
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md bg-[#FFC107] text-[#0A2463] hover:bg-[#e0a800] transition"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-bold text-[#0A2463] select-none">
              Mojad Fitness
            </h1>
          </header>
        )}

        {/* ===== Main Content (add margin-top for fixed header) ===== */}
        <main
          className="flex-1 p-3 sm:p-5 md:p-8 lg:p-10 overflow-x-hidden 
          mt-[64px] md:mt-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
