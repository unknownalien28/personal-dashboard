export type AtmosphereKey =
  | "home"
  | "tasks"
  | "notes"
  | "calendar"
  | "goals"
  | "finance"
  | "content"
  | "ai"
  | "profile";

/**
 * Each module gets a faint identity on top of the global accent-driven
 * nebula (see .ambient-nebula[data-atmosphere] in index.css) — subtle tints,
 * never a full theme swap.
 */
export function getAtmosphere(pathname: string): AtmosphereKey {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/notes")) return "notes";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/goals")) return "goals";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/content")) return "content";
  if (pathname.startsWith("/ai")) return "ai";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}
