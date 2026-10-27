import { cn } from "@/lib/utils";

export function StatusPill({
  tone,
  children,
}: {
  tone: "wait" | "ready" | "done";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "wait" && "bg-muted text-muted-foreground",
        tone === "ready" && "bg-[color:var(--accent)] text-[color:var(--navy)]",
        tone === "done" && "bg-[color:var(--navy)] text-white"
      )}
    >
      {children}
    </span>
  );
}
