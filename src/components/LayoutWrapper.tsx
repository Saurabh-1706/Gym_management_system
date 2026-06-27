"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/auth";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Automatically close sidebar on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0F0F0F] text-[#e5e2e1] relative overflow-x-hidden">
      {/* ===== Sidebar (Navbar) ===== */}
      {!hideNavbar && (
        <>
          <aside
            className={`fixed top-0 left-0 h-full bg-[#0e0e0e] text-[#e5e2e1] border-r border-zinc-800/80 shadow-lg z-40 transform transition-transform duration-300
              w-72 md:translate-x-0 ${
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            {/* ===== Mobile Header inside sidebar ===== */}
            <div className="flex items-center justify-between px-5 py-4 md:hidden border-b border-zinc-850">
              <h2 className="text-lg font-headline tracking-wider text-primary">Gym Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/10 rounded-md text-primary"
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden"
            ></div>
          )}
        </>
      )}

      {/* ===== Main Content Section ===== */}
      <div className="flex flex-col flex-1 min-h-screen md:ml-72 relative">
        {/* ===== Mobile Header (Top Bar) ===== */}
        {!hideNavbar && (
          <header
            className="fixed top-0 left-0 right-0 bg-[#0F0F0F]/90 border-b border-zinc-800/80 shadow-md backdrop-blur-md z-50 flex items-center justify-between 
            px-5 py-3 md:hidden"
          >
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-md bg-[#f97316] text-white hover:bg-[#ff8c3a] transition"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-xl font-headline tracking-wider text-[#f97316] select-none">
              IRON PULSE
            </h1>
          </header>
        )}

        {/* ===== Main Content (add margin-top for fixed header) ===== */}
        <main
          className="
            flex-1 w-full max-w-full overflow-x-hidden
            p-0 sm:p-0 md:p-0 lg:p-0
            mt-[56px] md:mt-0
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}
