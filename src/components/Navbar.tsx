"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Home,
  ClipboardList,
  Calendar,
  Users,
  Dumbbell,
  BookOpen,
  LogOut,
  ChevronRight,
  Package,
} from "lucide-react";

interface NavbarProps {
  onLinkClick?: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: <Home size={22} /> },
  { label: "Registration", href: "/registration", icon: <ClipboardList size={22} /> },
  { label: "Plan", href: "/plan", icon: <Calendar size={22} /> },
  { label: "View Members", href: "/members", icon: <Users size={22} /> },
  { label: "Coach", href: "/coach", icon: <Dumbbell size={22} /> },
  { label: "Inventory", href: "/inventory", icon: <Package size={24} /> },
  {
    label: "Report",
    href: "/report",
    icon: <BookOpen size={22} />,
    submenu: [
      { label: "Sale Report", href: "/report/sale" },
      { label: "New Joinee", href: "/report/new_joinee" },
      { label: "Electricity Bill", href: "/report/electricity_bill" },
      { label: "Miscellaneous", href: "/report/miscellaneous" },
    ],
  },
];

export default function Navbar({ onLinkClick }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const currentItemWithSubmenu = navItems.find(
      (item) => item.submenu && pathname.startsWith(item.href)
    );
    if (currentItemWithSubmenu) {
      setOpenSubmenu(currentItemWithSubmenu.href);
    }
  }, [pathname]);

  return (
    <div
      className="
        relative
        flex flex-col 
        bg-[#0A2463] text-white 
        rounded-r-3xl shadow-xl 
        w-64 sm:w-72 
        max-h-[90vh]
        mt-4 mb-4 ml-2
        p-4 sm:p-6
        scrollbar-thin scrollbar-thumb-[#FFC107]/60 scrollbar-track-transparent
      "
    >
      {/* ===== Scrollable Content Section ===== */}
      <div className="overflow-y-auto flex-1 pr-2">
        {/* ===== Logo Section ===== */}
        <Link
          href="/"
          className="block mb-4 md:mb-6 text-center"
          onClick={onLinkClick}
        >
          <img
            src="/logo-removebg-preview.png"
            alt="Mojad Fitness Logo"
            className="w-28 sm:w-32 md:w-40 mx-auto object-contain"
          />
        </Link>

        {/* ===== Navigation Links ===== */}
        <nav className="space-y-2 sm:space-y-3">
          {navItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isActive = !hasSubmenu && pathname === item.href;

            return (
              <div key={item.href}>
                {hasSubmenu ? (
                  <div>
                    <button
                      onClick={() =>
                        setOpenSubmenu(openSubmenu === item.href ? null : item.href)
                      }
                      className="flex items-center justify-between w-full px-4 py-2 rounded-lg text-base sm:text-lg hover:bg-[#0F3C78]/80 transition"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`transition-transform duration-300 ${
                          openSubmenu === item.href ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {openSubmenu === item.href && (
                      <div className="ml-6 mt-1 flex flex-col gap-1">
                        {item.submenu.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={onLinkClick}
                              className={`px-4 py-1.5 sm:py-2 rounded-lg text-white text-sm sm:text-base transition-all ${
                                isSubActive
                                  ? "bg-[#FFC107] text-[#0A2463]"
                                  : "hover:bg-[#0A2463]/70"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onLinkClick}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-base sm:text-lg transition-colors ${
                      isActive
                        ? "bg-[#FFC107] text-[#0A2463] font-semibold shadow-md"
                        : "hover:bg-[#0F3C78]/70 text-white"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ===== Fixed Logout Button (Bottom of Navbar) ===== */}
      {session && (
        <div
          className="
            sticky bottom-0 left-0
            bg-[#0A2463]
            pt-3 mt-2
            border-t border-[#ffffff2e]
          "
        >
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="flex items-center justify-center gap-3 px-4 py-2 sm:py-3 w-full bg-[#FFC107] hover:bg-[#e0a800] rounded-lg font-semibold text-[#0A2463] transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
