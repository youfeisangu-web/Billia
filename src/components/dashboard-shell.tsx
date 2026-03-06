"use client";

import { useState } from "react";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardHeader from "./dashboard-header";
import NavigationLoader from "./navigation-loader";
import BottomNav from "./bottom-nav";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-0 bg-white">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        {/* モバイルはbottom nav分の余白(pb-20)を確保 */}
        <main className="flex-1 overflow-y-auto px-4 md:pr-8 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav onMoreClick={() => setSidebarOpen(true)} />
      <NavigationLoader />
    </div>
  );
}
