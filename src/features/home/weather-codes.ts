import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, CloudDrizzle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Maps WMO weather codes (used by Open-Meteo) to a label and icon. */
export function describeWeatherCode(code: number): { label: string; icon: LucideIcon } {
  if (code === 0) return { label: "Clear sky", icon: Sun };
  if (code <= 2) return { label: "Partly cloudy", icon: Cloud };
  if (code === 3) return { label: "Overcast", icon: Cloud };
  if (code <= 48) return { label: "Foggy", icon: CloudFog };
  if (code <= 57) return { label: "Drizzle", icon: CloudDrizzle };
  if (code <= 67) return { label: "Rain", icon: CloudRain };
  if (code <= 77) return { label: "Snow", icon: CloudSnow };
  if (code <= 82) return { label: "Rain showers", icon: CloudRain };
  if (code <= 86) return { label: "Snow showers", icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorm", icon: CloudLightning };
  return { label: "Weather", icon: Cloud };
}
