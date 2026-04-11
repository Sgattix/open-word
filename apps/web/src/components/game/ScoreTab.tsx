import { cn, formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useGame } from "@/context/GameContex";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";

function ScoreTab() {
  const { game, finalScore, settings, resetGameState, saveGameMutation } =
    useGame();
  const { data: session } = authClient.useSession();
  const [wordMeaning, setWordMeaning] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user || !game || !finalScore) return;

    const saveGame = async () => {
      try {
        await saveGameMutation.mutateAsync({
          difficulty: finalScore.difficulty,
          wordLength: game.wordLength,
          guessWord: game.revealedWord || "",
          status: game.status as "won" | "lost",
          guessesUsed: finalScore.guessesUsed,
          attemptsLeft: game.attemptsLeft,
          hintsUsed: finalScore.hintsUsed,
          timeTaken: finalScore.timeTaken,
          score: finalScore.score,
          attemptBonus: finalScore.attemptBonus,
          timeBonus: finalScore.timeBonus,
          difficultyMultiplier: finalScore.difficultyMultiplier,
          guesses: game.guesses,
        });
      } catch (error) {
        console.error("Failed to save game:", error);
      }
    };

    saveGame();
  }, [session?.user, game?.gameId, finalScore?.score]);

  useEffect(() => {
    const fetchWordMeaning = async () => {
      try {
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${game?.revealedWord}`,
        );
        const data = await response.json();
        if (data && data[0]?.meanings) {
          setWordMeaning(data[0].meanings[0].definitions[0].definition);
        }
      } catch (error) {
        console.error("Failed to fetch word meaning:", error);
      }
    };
    fetchWordMeaning();
  }, []);

  if (!game) return null;
  const isWon = game?.status === "won";

  return (
    <>
      <CardHeader className="space-y-3 text-center pt-8 pb-6">
        <CardTitle
          className={cn(
            "text-4xl font-black tracking-[0.18em] uppercase",
            isWon ? "text-[#6aaa64]" : "text-zinc-900 dark:text-white",
          )}
        >
          {isWon ? "You Won!" : "Game Over"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div
          className={cn(
            "text-center p-6 rounded-lg",
            isWon
              ? "bg-[#6aaa64]/10 border border-[#6aaa64]"
              : "bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600",
          )}
        >
          <div className="text-6xl font-black text-zinc-900 dark:text-white">
            {finalScore?.score}
          </div>
          <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase mt-2">
            Points
          </div>
        </div>

        <div className="grid grid-cols-2 items-start gap-4 w-full">
          <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold mb-2">
            The word was
            <div className="text-lg font-bold text-zinc-900 dark:text-white">
              {game.revealedWord || "N/A"}
            </div>
          </div>
          {wordMeaning && (
            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold mb-2">
              <p className="uppercase">Meaning</p>
              <div className="text-lg text-zinc-900 dark:text-white">
                {wordMeaning}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
              Time
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
              {formatTime(finalScore?.timeTaken || 0)}
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
              Guesses
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
              {finalScore?.guessesUsed} / {settings.maxAttempts}
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
              Difficulty
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1 capitalize">
              {finalScore?.difficulty}
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
            <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
              Hints Used
            </div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
              {finalScore?.hintsUsed} / {settings.hintsAllowed}
            </div>
          </div>
        </div>

        <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
          <div>• Attempts bonus: +{finalScore?.attemptBonus} pts</div>
          <div>• Time bonus: +{finalScore?.timeBonus} pts</div>
          <div>
            • Difficulty×: {finalScore?.difficultyMultiplier?.toFixed(1)}x
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-center py-6">
        <Button
          onClick={() => resetGameState()}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 font-bold tracking-wide uppercase hover:opacity-90 transition-opacity h-11"
        >
          Play Again
        </Button>
        {!session && (
          <Link
            href="/login"
            className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Save your score
          </Link>
        )}
      </CardFooter>
    </>
  );
}

export default ScoreTab;
