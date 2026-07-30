import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useProfileStore } from "@/features/profile/profile-store";
import { useAuthStore } from "@/features/auth/auth-store";

export function UserMenu() {
  const navigate = useNavigate();
  const name = useProfileStore((s) => s.name);
  const avatarColor = useProfileStore((s) => s.avatarColor);
  const avatarDataUrl = useProfileStore((s) => s.avatarDataUrl);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const displayName = name || user?.email || "Account";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors duration-150"
      >
        <Avatar name={displayName} color={avatarColor} dataUrl={avatarDataUrl} size="sm" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--color-border)] glass-panel shadow-lg overflow-hidden z-20 page-fade-in">
          <div className="px-3 py-3 border-b border-[var(--color-border)]">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{displayName}</p>
            {user?.email && <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>}
          </div>
          <div className="p-1.5">
            <button
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="w-full flex items-center gap-2 rounded-lg px-3 h-10 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <User className="h-4 w-4" /> Profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                navigate("/profile");
              }}
              className="w-full flex items-center gap-2 rounded-lg px-3 h-10 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 rounded-lg px-3 h-10 text-sm text-danger hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
