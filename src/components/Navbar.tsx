'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  Calendar,
  Users,
  Dumbbell,
  BookOpen,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: <Home size={22} /> },
  { label: "Registration", href: "/registration", icon: <ClipboardList size={22} /> },
  { label: "Plan", href: "/plan", icon: <Calendar size={22} /> },
  { label: "View Members", href: "/members", icon: <Users size={22} /> },
  { label: "Report", href: "/report", icon: <BookOpen size={22} /> },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-72 bg-[#0a1631] border-r-4 border-orange-500 text-white p-8 shadow-lg z-50">
      {/* Logo / Brand (clickable) */}
      <Link
        href="/"
        className="flex items-center gap-3 mb-12 hover:opacity-80 transition text-3xl font-bold"
      >
        <Dumbbell size={28} />
        Mojad Fitness
      </Link>

      {/* Navigation Links */}
      <nav className="space-y-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-3 rounded-lg transition text-lg ${
                isActive
                  ? "bg-white text-[#0a1631] font-bold shadow-md"
                  : "hover:bg-white/10 text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
