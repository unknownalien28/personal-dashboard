import { useLocation } from "react-router-dom";
import type { ModuleKey } from "@/features/ai/context-engine";

/**
 * Contextual AI (Phase 6, Part 5): the floating assistant and "Ask Alien"
 * shortcut buttons pass this straight into `sendUserMessage`'s
 * `forceModules` param, so being on the Finance page means the assistant
 * already has finance context even if you just type "how am I doing?" -
 * no manual context switch required.
 */
export function useCurrentPageModule(): ModuleKey[] {
  const { pathname } = useLocation();
  if (pathname.startsWith("/tasks")) return ["tasks"];
  if (pathname.startsWith("/notes")) return ["notes"];
  if (pathname.startsWith("/calendar")) return ["calendar"];
  if (pathname.startsWith("/goals")) return ["goals"];
  if (pathname.startsWith("/finance")) return ["finance"];
  if (pathname.startsWith("/content")) return ["content"];
  return [];
}
