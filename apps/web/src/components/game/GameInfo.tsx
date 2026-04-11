import { cn } from "@/lib/utils";
import type { GameState } from "@/types/game";
import { useMemo } from "react";

function GameInfo({ game }: { game: GameState | null }) {
  const statusLabel = useMemo(() => {
    if (!game) {
      return "No active game";
    }

    if (game.status === "won") {
      return "You won";
    }

    if (game.status === "lost") {
      return "Game over";
    }

    return "In progress";
  }, [game]);

  const isWon = useMemo(() => game?.status === "won", [game?.status]);
  const isLost = useMemo(() => game?.status === "lost", [game?.status]);

  return (
    <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-wider uppercase px-0 md:px-4">
      <span
        className={cn(
          "transition-colors duration-300",
          isWon
            ? "text-[#6aaa64]"
            : isLost
              ? "text-zinc-600 dark:text-zinc-400"
              : "text-zinc-600 dark:text-zinc-400",
        )}
      >
        {statusLabel}
      </span>
      <span className="text-zinc-600 dark:text-zinc-400">
        {game?.attemptsLeft} guesses left
      </span>
    </div>
  );
}

export default GameInfo;
