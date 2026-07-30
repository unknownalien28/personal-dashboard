import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useProfileStore } from "@/features/profile/profile-store";
import { resizeImageToDataUrl } from "@/features/profile/avatar-utils";

const TIMEZONES = Intl.supportedValuesOf ? Intl.supportedValuesOf("timeZone") : [Intl.DateTimeFormat().resolvedOptions().timeZone];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
];

export function ProfileSection() {
  const profile = useProfileStore();
  const { updateProfile } = profile;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      updateProfile({ avatarDataUrl: dataUrl });
      setAvatarError(null);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Could not process that image.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div className="flex items-center gap-4">
        <Avatar name={profile.name} color={profile.avatarColor} dataUrl={profile.avatarDataUrl} size="lg" />
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            aria-label="Upload avatar image"
          />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-4 w-4" /> Upload photo
          </Button>
          {profile.avatarDataUrl && (
            <button
              onClick={() => updateProfile({ avatarDataUrl: null })}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline text-left"
            >
              Remove photo
            </button>
          )}
          {avatarError && <p className="text-xs text-danger">{avatarError}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Name</label>
        <input
          value={profile.name}
          onChange={(e) => updateProfile({ name: e.target.value })}
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Role</label>
        <input
          value={profile.role}
          onChange={(e) => updateProfile({ role: e.target.value })}
          placeholder="e.g. Product Designer"
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Email</label>
        <input
          type="email"
          value={profile.email}
          onChange={(e) => updateProfile({ email: e.target.value })}
          placeholder="you@example.com"
          className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Bio</label>
        <textarea
          value={profile.bio}
          onChange={(e) => updateProfile({ bio: e.target.value })}
          rows={3}
          placeholder="A little about you..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Timezone</label>
          <select
            value={profile.timezone}
            onChange={(e) => updateProfile({ timezone: e.target.value })}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Language</label>
          <select
            value={profile.language}
            onChange={(e) => updateProfile({ language: e.target.value })}
            className="w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
