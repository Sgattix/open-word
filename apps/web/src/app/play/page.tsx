"use client";

import { useEffect, useMemo } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPSlot } from "@/components/ui/input-otp";
import { cn, calculateScore } from "@/lib/utils";
import WordWrapper from "@/components/WordWrapper";
import { runConfettiAnimation } from "@/lib/utils";
import { useGame } from "@/context/GameContex";
import SettingsTab from "@/components/game/SettingsTab";

function PlayPage() {
  const {
    gameId,
    setGameId,
    setGuess,
    guess,
    setGameStartTime,
    gameStartTime,
    setHintsUsed,
    setFinalScore,
    setGameDuration,
    gameDuration,
    settings,
    showSettings,
    setShowSettings,
    finalScore,
    hintsUsed,
    game,
    handleSubmitGuess,
    isBusy,
    canSubmitGuess,
  } = useGame();

  useEffect(() => {
    if (!gameStartTime || !gameId || game?.status !== "playing") return;
    const interval = setInterval(() => {
      setGameDuration(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [gameStartTime, gameId, game?.status]);

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

  const isWon = game?.status === "won";
  const isLost = game?.status === "lost";

  const emptyRows = useMemo(() => {
    if (!game) {
      return 0;
    }

    if (game.status === "playing") {
      return Math.max(0, game.attemptsLeft - 1);
    }

    return game.attemptsLeft;
  }, [game]);

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  useEffect(() => {
    if (game?.status && game.status === "won") {
      runConfettiAnimation(500);
      const score = calculateScore(game, settings, hintsUsed, gameDuration);
      setFinalScore(score);
    }
    if (game?.status && game.status === "lost") {
      const score = calculateScore(game, settings, hintsUsed, gameDuration);
      setFinalScore(score);
    }
  }, [game?.status]);

  return (
    <main
      className={cn(
        "relative mx-auto flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 bg-white dark:bg-zinc-900 transition-all duration-500",
        isWon && "play-celebrate",
      )}
    >
      <Card className="relative w-full max-w-2xl border-0 bg-white dark:bg-zinc-900 shadow-none">
        {showSettings && !gameId && <SettingsTab />}

        {/* Game Screen */}
        {game && !finalScore && (
          <>
            <CardHeader className="space-y-3 text-center pt-8 pb-6">
              <CardTitle className="text-4xl font-black tracking-[0.18em] uppercase text-zinc-900 dark:text-white">
                Solo Play
              </CardTitle>
              <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase">
                {settings.difficulty} • {formatTime(gameDuration)}
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-0 md:px-6">
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
                  {game.attemptsLeft} left
                </span>
              </div>

              <form
                className="flex flex-col items-center gap-6"
                onSubmit={handleSubmitGuess}
              >
                <div className="w-full space-y-2 flex flex-col items-center">
                  {game.guesses.length > 0
                    ? game.guesses.map((entry, index) => (
                        <div
                          key={`${entry.guess}-${index}`}
                          className="animate-board-row-in flex items-center justify-center"
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <WordWrapper statuses={entry.feedback} size="board">
                            {entry.guess}
                          </WordWrapper>
                        </div>
                      ))
                    : null}

                  {game.status === "playing" && (
                    <div className="flex items-center justify-center py-2">
                      <InputOTP
                        value={guess}
                        onChange={(value) => setGuess(value.toUpperCase())}
                        maxLength={game.wordLength}
                        disabled={game.status !== "playing" || isBusy}
                        containerClassName="justify-center"
                        className="flex items-center justify-center"
                      >
                        {Array.from({ length: game.wordLength }).map(
                          (_, index) => (
                            <InputOTPSlot
                              key={index}
                              index={index}
                              className={cn(
                                "h-14 w-14 md:h-16 md:w-16 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-center text-xl md:text-2xl font-bold uppercase rounded-lg mx-1 transition-colors duration-300",
                              )}
                            />
                          ),
                        )}
                      </InputOTP>
                    </div>
                  )}

                  {Array.from({ length: emptyRows }).map((_, rowIndex) => (
                    <div
                      key={`empty-${rowIndex}`}
                      className="flex items-center justify-center gap-1.5"
                    >
                      {Array.from({ length: game.wordLength }).map(
                        (__, colIndex) => (
                          <span
                            key={`empty-${rowIndex}-${colIndex}`}
                            className="h-14 w-14 md:h-16 md:w-16 border border-zinc-300 dark:border-zinc-600 bg-white/95 dark:bg-zinc-800/95 rounded-lg"
                          />
                        ),
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmitGuess || isBusy}
                  className="h-11 w-full max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isBusy ? "Checking..." : "Guess"}
                </Button>
              </form>

              {game.revealedWord && (
                <p
                  className={cn(
                    "animate-status-pop text-center text-xs font-semibold tracking-wide uppercase",
                    isWon
                      ? "text-[#6aaa64]"
                      : "text-zinc-600 dark:text-zinc-400",
                  )}
                >
                  The word was:{" "}
                  <strong>{game.revealedWord.toUpperCase()}</strong>
                </p>
              )}
            </CardContent>
          </>
        )}

        {/* Score Screen */}
        {finalScore && (
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
                  {finalScore.score}
                </div>
                <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase mt-2">
                  Points
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                    Time
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                    {formatTime(finalScore.timeTaken)}
                  </div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                    Guesses
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                    {finalScore.guessesUsed} / {settings.maxAttempts}
                  </div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                    Difficulty
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1 capitalize">
                    {finalScore.difficulty}
                  </div>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                    Hints Used
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1">
                    {hintsUsed} / {settings.hintsAllowed}
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                <div>• Attempts bonus: +{finalScore.attemptBonus} pts</div>
                <div>• Time bonus: +{finalScore.timeBonus} pts</div>
                <div>
                  • Difficulty×: {finalScore.difficultyMultiplier.toFixed(1)}x
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-center py-6">
              <Button
                onClick={() => {
                  setGameId(null);
                  setGuess("");
                  setFinalScore(null);
                  setShowSettings(true);
                  setGameStartTime(null);
                  setGameDuration(0);
                }}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 font-bold tracking-wide uppercase hover:opacity-90 transition-opacity h-11"
              >
                Play Again
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </main>
  );
}

export default PlayPage;
