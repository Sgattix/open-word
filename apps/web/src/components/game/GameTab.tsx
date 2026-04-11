import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";
import { useGame } from "@/context/GameContex";
import { useMemo } from "react";
import GameInfo from "./GameInfo";
import GuessGrid from "./GuessGrid";

function GameTab() {
  const {
    game,
    handleSubmitGuess,
    isBusy,
    canSubmitGuess,
    settings,
    gameDuration,
    useHintMutation,
    hintsUsed,
  } = useGame();
  if (!game) return null;

  const isWon = game?.status === "won";

  const canUseHint = useMemo(() => {
    return (
      hintsUsed < settings.hintsAllowed &&
      !isBusy &&
      Object.keys(game?.hintedLetters || {}).length < (game?.wordLength || 0)
    );
  }, [game, settings.hintsAllowed, hintsUsed, isBusy]);

  const handleUseHint = () => {
    if (!game?.gameId || !canUseHint) return;

    useHintMutation.mutate({ gameId: game.gameId });
  };

  return (
    <>
      <CardHeader className="space-y-3 text-center pt-8 pb-6">
        <CardTitle className="text-4xl font-black tracking-[0.18em] uppercase text-zinc-900 dark:text-white">
          Solo Play
        </CardTitle>
        <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
          {settings.difficulty} • {formatTime(gameDuration)}
        </div>
      </CardHeader>

      <GameInfo game={game} />

      <CardContent className="space-y-6 px-0 md:px-6">
        <form
          className="flex flex-col items-center gap-6"
          onSubmit={handleSubmitGuess}
        >
          <GuessGrid />
          <Button
            type="submit"
            disabled={!canSubmitGuess || isBusy}
            className="h-11 w-full max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isBusy ? "Checking..." : "Guess"}
          </Button>

          <div className="w-full flex items-center gap-3 justify-center max-w-xs">
            <Button
              type="button"
              onClick={handleUseHint}
              disabled={!canUseHint}
              className="flex-1 h-10 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold tracking-wide uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Hint
            </Button>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              {hintsUsed} / {settings.hintsAllowed}
            </span>
          </div>
        </form>
      </CardContent>
    </>
  );
}

export default GameTab;
