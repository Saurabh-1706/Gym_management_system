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
    <div className="flex flex-col h-full bg-[#0e0e0e] text-[#e5e2e1] p-4 sm:p-5">
      {/* ===== Scrollable Content Section ===== */}
      <div className="overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {/* ===== Logo Section ===== */}
        <Link
          href="/"
          className="block mb-8 text-center"
          onClick={onLinkClick}
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 mb-2">
              <span className="text-[#f97316] font-bold text-2xl">⚡</span>
            </div>
            <span className="font-headline text-3xl tracking-widest text-[#f97316]">IRON PULSE</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#e0c0b1] opacity-70">Elite Performance</span>
          </div>
        </Link>

        {/* ===== Navigation Links ===== */}
        <nav className="space-y-1.5">
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
                      className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-base hover:bg-white/5 transition-all text-[#e0c0b1] hover:text-white"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#f97316]">{item.icon}</span>
                        <span className="font-body text-sm font-medium">{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`transition-transform duration-300 w-4 h-4 ${
                          openSubmenu === item.href ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {openSubmenu === item.href && (
                      <div className="ml-8 mt-1 flex flex-col gap-1 border-l border-zinc-800 pl-3">
                        {item.submenu.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={onLinkClick}
                              className={`px-3 py-1.5 rounded-md text-xs font-body transition-all ${
                                isSubActive
                                  ? "text-[#f97316] font-semibold"
                                  : "text-zinc-400 hover:text-white hover:bg-white/5"
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
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-base transition-all ${
                      isActive
                        ? "bg-[#22c55e]/10 text-[#22c55e] border-l-4 border-[#22c55e] font-semibold shadow-sm"
                        : "hover:bg-white/5 text-[#e0c0b1] hover:text-white"
                    }`}
                  >
                    <span className={isActive ? "text-[#22c55e]" : "text-zinc-500"}>
                      {item.icon}
                    </span>
                    <span className="font-body text-sm font-medium">{item.label}</span>
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
            bg-[#0e0e0e]
            pt-4 mt-2
            border-t border-zinc-800/80
          "
        >
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-[#f97316] hover:bg-[#ff8c3a] rounded-lg font-headline text-lg tracking-wider text-white transition-all shadow-md active:scale-98"
          >
            <LogOut size={16} />
            <span>LOGOUT</span>
          </button>
        </div>
      )}
    </div>
  );
}
