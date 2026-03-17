"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { getTenantGroups } from "@/app/actions/tenant-group";
import { useEffect, useState } from "react";

type TenantGroup = {
  id: string;
  name: string;
};

type DashboardHeaderProps = {
  onMenuClick?: () => void;
};

export default function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const [groups, setGroups] = useState<TenantGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("すべて");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const groupId = params.get("groupId");
    setSelectedGroupId(groupId);
    getTenantGroups().then((list) => {
      setGroups(list);
      if (groupId) {
        const g = list.find((x) => x.id === groupId);
        setSelectedName(g?.name ?? "プロジェクト");
      } else {
        setSelectedName("すべて");
      }
    });
  }, [pathname]);

  return (
    <header
      className="shrink-0 h-[56px] md:h-[60px] flex items-center px-3 md:px-6 bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <div className="flex items-center justify-between gap-2 md:gap-4 w-full">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="メニューを開く"
            className="md:hidden p-2 rounded-lg text-black/40 hover:bg-black/5 hover:text-black transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="relative hidden md:flex items-center gap-2 rounded-lg border border-black/5 bg-black/5 hover:bg-black/10 transition-colors px-3 md:px-4 py-2 md:py-2.5 text-sm cursor-pointer min-w-0 md:min-w-[200px] max-w-[180px] md:max-w-none">
            <span className="truncate text-black font-semibold tracking-wide">プロジェクト: {selectedName}</span>
            <ChevronDown className="w-4 h-4 shrink-0 text-black/40" />
            <select
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={selectedGroupId ?? ""}
              onChange={(e) => {
                const id = e.target.value || null;
                const url = id
                  ? `${pathname}?groupId=${id}`
                  : pathname?.split("?")[0] ?? "/dashboard";
                window.location.href = url;
              }}
            >
              <option value="">すべて</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 rounded-lg border border-black/5 bg-white shadow-sm px-4 py-2.5 min-w-[200px] transition-all focus-within:border-black/20 focus-within:ring-4 focus-within:ring-black/5">
            <Search className="w-4 h-4 shrink-0 text-black/40" />
            <input
              type="search"
              placeholder="検索"
              className="w-full bg-transparent text-sm font-medium tracking-wide text-black placeholder-black/30 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <OrganizationSwitcher
            hidePersonal={false}
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "flex items-center",
                organizationSwitcherTrigger: "rounded-lg border border-black/5 bg-white shadow-sm px-3 py-2 text-sm font-semibold text-black hover:bg-black/5 transition-colors",
              },
            }}
          />
          <button
            type="button"
            className="relative p-2.5 rounded-lg text-black/40 hover:bg-black/5 hover:text-black transition-colors"
            aria-label="通知"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 border-2 border-white pointer-events-none" />
          </button>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
