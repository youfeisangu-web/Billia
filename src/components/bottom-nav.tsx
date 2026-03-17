"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Receipt,
  Menu,
} from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/invoices", label: "請求書", icon: FileText, exact: false },
  { href: "/dashboard/quotes", label: "見積書", icon: ClipboardList, exact: false },
  { href: "/dashboard/expenses", label: "経費", icon: Receipt, exact: false },
] as const;

export default function BottomNav({ onMoreClick }: { onMoreClick: () => void }) {
  const pathname = usePathname();

  return (
    <nav 
      className="md:hidden fixed bottom-5 inset-x-4 z-50 pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="pointer-events-auto bg-white/80 backdrop-blur-xl border border-black/5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-full px-2 py-2 flex items-center justify-between">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-all duration-300 group"
            >
              <div className={`relative p-2.5 rounded-2xl transition-all duration-300 ${isActive ? "bg-white shadow-sm ring-1 ring-black/5 scale-110" : "group-hover:bg-black/5"}`}>
                <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-black drop-shadow-sm" : "text-black/40"}`} />
              </div>
              <span className={`text-[9px] font-extrabold tracking-wider transition-colors duration-300 ${isActive ? "text-black" : "text-black/40"}`}>
                {label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="relative flex-1 flex flex-col items-center justify-center py-1 gap-1 transition-all duration-300 group"
        >
          <div className="relative p-2.5 rounded-2xl transition-all duration-300 group-hover:bg-black/5">
            <Menu className="w-5 h-5 text-black/40 transition-colors duration-300 group-hover:text-black/70" />
          </div>
          <span className="text-[9px] font-extrabold tracking-wider text-black/40 transition-colors duration-300 group-hover:text-black/70">
            もっと
          </span>
        </button>
      </div>
    </nav>
  );
}
