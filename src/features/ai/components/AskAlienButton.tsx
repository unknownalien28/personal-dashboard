import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { askAlien } from "@/features/ai/ask-alien";
import type { ModuleKey } from "@/features/ai/context-engine";

interface AskAlienButtonProps {
  label: string;
  prompt: string;
  module: ModuleKey;
  className?: string;
}

/** Phase 6, Part 7 - AI shortcuts. One shared button reused across every module's page header. */
export function AskAlienButton({ label, prompt, module, className }: AskAlienButtonProps) {
  return (
    <Button variant="secondary" size="sm" onClick={() => askAlien(prompt, [module])} className={className}>
      <Sparkles className="h-4 w-4" /> {label}
    </Button>
  );
}
