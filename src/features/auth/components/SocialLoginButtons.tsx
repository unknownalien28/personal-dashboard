import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/lib/toast-store";

const providers = [
  { key: "google", label: "Google" },
  { key: "github", label: "GitHub" },
  { key: "microsoft", label: "Microsoft" },
] as const;

/** Not wired to real OAuth yet — clicking shows a "coming soon" toast so the UI is ready the moment a provider is added. */
export function SocialLoginButtons() {
  const showToast = useToastStore((s) => s.showToast);

  return (
    <div className="grid grid-cols-3 gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.key}
          type="button"
          variant="secondary"
          className="justify-center"
          onClick={() => showToast(`${provider.label} sign-in is coming soon`, "info")}
        >
          {provider.label}
        </Button>
      ))}
    </div>
  );
}
