import Letter from "./Letter";
import { cn } from "@/lib/utils";

const sizes: Record<string, string> = {
  sm: "h-10 w-10 text-xs md:h-12 md:w-12 md:text-sm",
  md: "h-12 w-12 text-base md:h-14 md:w-14 md:text-lg",
  board: "h-14 w-14 text-xl md:h-16 md:w-16 md:text-2xl",
  lg: "h-24 w-24 text-5xl md:h-28 md:w-28 md:text-7xl",
};

function WordWrapper({
  children,
  statuses,
  className,
  size = "md",
}: Readonly<{
  children: React.ReactNode;
  statuses: string[];
  className?: string;
  size?: keyof typeof sizes;
}>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className,
      )}
    >
      {children
        ?.toString()
        .split("")
        .map((char, index) => (
          <Letter
            key={index}
            status={statuses[index] || "unknown"}
            index={index}
            className={cn("font-black", sizes[size])}
          >
            {char}
          </Letter>
        ))}
    </div>
  );
}

export default WordWrapper;
