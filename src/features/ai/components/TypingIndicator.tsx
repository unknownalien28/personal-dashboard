export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 h-5 px-1" aria-label="Alien Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-bounce"
          style={{ animationDelay: `${i * 120}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}
