import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4 empty-state-in">
      <img src="/logo.svg" alt="" className="h-14 w-14 rounded-xl" />
      <div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Page not found</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
          That page doesn't exist in AlienOS. It may have moved, or the link might be out of date.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center h-11 md:h-9 px-4 rounded-lg text-sm font-medium bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm shadow-accent-500/20 transition-colors duration-150"
      >
        Back to Home
      </Link>
    </div>
  );
}
