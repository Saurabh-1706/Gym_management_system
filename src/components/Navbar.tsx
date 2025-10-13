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

const navItems = [
  { label: "Dashboard", href: "/", icon: <Home size={22} /> },
  {
    label: "Registration",
    href: "/registration",
    icon: <ClipboardList size={22} />,
  },
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

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Automatically open submenu if user is on a subpage
  useEffect(() => {
    const currentItemWithSubmenu = navItems.find(
      (item) => item.submenu && pathname.startsWith(item.href)
    );
    if (currentItemWithSubmenu) {
      setOpenSubmenu(currentItemWithSubmenu.href);
    }
  }, [pathname]);

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 bg-[#0A2463] text-white p-8 shadow-lg z-50 flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Logo / Brand */}
        <Link href="/" className="block mb-8 mr-4">
          <img
            src="/logo-removebg-preview.png"
            alt="Mojad Fitness Logo"
            className="w- h-full object-contain object-center mx-auto"
          />
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-4">
          {navItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            // Active only for items without submenu OR for submenu items themselves
            const isActive = !hasSubmenu && pathname === item.href;

            return (
              <div key={item.href}>
                {hasSubmenu ? (
                  <div>
                    {/* Parent button (Report) never highlighted) */}
                    <button
                      onClick={() =>
                        setOpenSubmenu(
                          openSubmenu === item.href ? null : item.href
                        )
                      }
                      className={`flex items-center justify-between gap-4 px-5 py-3 rounded-lg text-xl w-full transition-colors hover:bg-[#0A2463]/80 text-white`}
                    >
                      <div className="flex items-center gap-4">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={`transition-transform duration-300 ${
                          openSubmenu === item.href ? "rotate-90" : ""
                        }`}
                      />
                    </button>

                    {/* Submenu */}
                    {/* Submenu */}
                    {openSubmenu === item.href && (
                      <div className="ml-8 mt-1 flex flex-col gap-1">
                        {item.submenu!.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`
                                px-5 py-2 rounded-lg text-white text-xl
                                transition-all duration-300 ease-in-out
                                ${
                                  isSubActive
                                    ? "bg-[#FFC107] text-[#0A2463]"
                                    : "hover:bg-[#0A2463]/70"
                                }
                              `}
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
                    className={`flex items-center gap-4 px-5 py-3 rounded-lg text-xl transition-colors ${
                      isActive
                        ? "bg-[#FFC107] text-[#0A2463] font-semibold shadow-md"
                        : "hover:bg-[#0A2463]/80 text-white"
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

      {/* Bottom Section (Logout) */}
      {session && (
        <div className="mt-auto">
          <button
            onClick={() => signOut({ callbackUrl: "/auth" })}
            className="flex items-center gap-3 px-5 py-3 w-full bg-[#0A2463] hover:bg-[#0F3C78] rounded-lg font-semibold text-white transition-colors shadow"
          >
            <LogOut size={22} />
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
