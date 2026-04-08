import { cn } from "@/lib/utils";

const statuses: Record<string, string> = {
  correct: "border-[#6aaa64] bg-[#6aaa64] text-white",
  present: "border-[#c9b458] bg-[#c9b458] text-white",
  absent: "border-[#787c7e] bg-[#787c7e] text-white",
  unknown:
    "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white",
};

function Letter({
  children,
  status,
  index,
  className,
}: Readonly<{
  children: React.ReactNode;
  status: string;
  index: number;
  className?: string;
}>) {
  const tileStatus = statuses[status] ?? statuses.unknown;

  return (
    <span
      className={cn(
        "animate-flip inline-flex items-center justify-center border p-0 text-center uppercase rounded-lg shadow-sm",
        tileStatus,
        className,
      )}
      style={{ animationDelay: `${index * 180}ms` }}
    >
      {children}
    </span>
  );
}

export default Letter;
