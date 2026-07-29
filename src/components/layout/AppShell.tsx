import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { AmbientBackground } from "@/components/background/AmbientBackground";
import { useApplyTheme } from "@/hooks/useApplyTheme";
import { useApplyAppearance } from "@/hooks/useApplyAppearance";
import { useApplyVisualEffects } from "@/hooks/useApplyVisualEffects";

export function AppShell() {
  useApplyTheme();
  useApplyAppearance();
  useApplyVisualEffects();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-[var(--color-canvas)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <AmbientBackground />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="relative z-[1] flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div key={location.pathname} className="mx-auto max-w-6xl px-4 md:px-6 py-6 page-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
      <ToastContainer />
    </div>
  );
}
