import type { LucideIcon } from "lucide-react";
import { Sparkles, Orbit, Star, Wind, MousePointer2, Flame, Layers, Gauge } from "lucide-react";
import { useSettingsStore } from "@/features/profile/settings-store";
import type { VisualEffectsSettings } from "@/types/models";

interface ToggleRow {
  key: keyof VisualEffectsSettings;
  label: string;
  description: string;
  icon: LucideIcon;
}

const rows: ToggleRow[] = [
  {
    key: "ambientBackground",
    label: "Ambient Space Background",
    description: "The layered cosmic backdrop behind every screen",
    icon: Sparkles,
  },
  {
    key: "floatingPlanets",
    label: "Floating Planets",
    description: "Slow-drifting blurred planets and moons",
    icon: Orbit,
  },
  {
    key: "starField",
    label: "Star Field",
    description: "Sparse twinkling stars scattered across the background",
    icon: Star,
  },
  {
    key: "floatingParticles",
    label: "Floating Particles",
    description: "Tiny particles drifting slowly upward",
    icon: Wind,
  },
  {
    key: "mouseParallax",
    label: "Mouse Parallax",
    description: "Background layers shift gently as you move the cursor",
    icon: MousePointer2,
  },
  {
    key: "glowEffects",
    label: "Glow Effects",
    description: "Ambient accent-colored glow on nav, cards, and panels",
    icon: Flame,
  },
  {
    key: "glassEffects",
    label: "Glass Effects",
    description: "Frosted glass blur on the sidebar, topbar, and nav",
    icon: Layers,
  },
];

export function VisualEffectsSection() {
  const { visualEffects, updateVisualEffects } = useSettingsStore();

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ambient effects</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
          Turn any part of AlienOS's ambient identity on or off independently. Everything here already
          respects reduced-motion automatically.
        </p>

        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <label
              key={row.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-4 h-14"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-lg bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
                  <row.icon className="h-4 w-4 text-accent-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{row.label}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{row.description}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={visualEffects[row.key] as boolean}
                onChange={(e) => updateVisualEffects({ [row.key]: e.target.checked })}
                className="h-5 w-5 rounded accent-accent-500 shrink-0"
              />
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-4 h-14">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
            <Gauge className="h-4 w-4 text-accent-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reduced Visual Effects</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Lite mode — turns off planets and particles for lower-powered devices
            </p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={visualEffects.reducedVisualEffects}
          onChange={(e) => updateVisualEffects({ reducedVisualEffects: e.target.checked })}
          className="h-5 w-5 rounded accent-accent-500 shrink-0"
        />
      </label>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        All ambient motion also stops automatically when your system's "Reduce motion" preference is on, or
        when Reduced Motion is enabled in Appearance.
      </p>
    </div>
  );
}
