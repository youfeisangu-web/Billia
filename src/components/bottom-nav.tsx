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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                isActive ? "text-billia-blue" : "text-slate-400"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-billia-blue" : "text-slate-400"}`} />
              <span className={`text-[10px] font-semibold ${isActive ? "text-billia-blue" : "text-slate-400"}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-billia-blue" />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-slate-400"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-semibold">もっと</span>
        </button>
      </div>
    </nav>
  );
}
