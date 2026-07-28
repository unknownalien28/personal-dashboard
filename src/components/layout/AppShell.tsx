import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { useApplyTheme } from "@/hooks/useApplyTheme";
import { useApplyAppearance } from "@/hooks/useApplyAppearance";

export function AppShell() {
  useApplyTheme();
  useApplyAppearance();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[var(--color-canvas)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 page-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
