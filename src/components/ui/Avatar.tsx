import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  name: string;
  color: string;
  dataUrl: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function Avatar({ name, color, dataUrl, size = "md", className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt={`${name}'s avatar`}
        className={cn("rounded-full object-cover shrink-0", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${name}'s avatar`}
      style={{ backgroundColor: color }}
      className={cn("rounded-full flex items-center justify-center font-semibold text-white shrink-0", sizeClasses[size], className)}
    >
      {initial}
    </div>
  );
}
