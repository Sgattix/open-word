"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GuessGridBoard from "@/components/shared/GuessGridBoard";
import Loader from "@/components/shared/loader";
import { useMultiplayerGameLogic } from "./useMultiplayerGameLogic";

export function MultiplayerGameScreen() {
  const {
    allPlayersFinished,
    currentRound,
    finalRanking,
    guess,
    guesses,
    handleFinishGame,
    handleNextRound,
    handleSubmit,
    isHost,
    players,
    roomStatus,
    setGuess,
    showFinalLeaderboard,
    totalRounds,
    userFinished,
    userPlayer,
    userScore,
    wordLength,
    submitGuessMutation,
    startNextRoundMutation,
    endRoundMutation,
    finishGameMutation,
    roundRemainingSeconds,
    timePerRoundSeconds,
  } = useMultiplayerGameLogic();

  const formattedRoundTime = useMemo(() => {
    const minutes = Math.floor(roundRemainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (roundRemainingSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [roundRemainingSeconds]);

  const canType =
    roomStatus === "playing" && !userFinished && roundRemainingSeconds > 0;
  const isTransitioning =
    submitGuessMutation.isPending ||
    endRoundMutation.isPending ||
    startNextRoundMutation.isPending ||
    finishGameMutation.isPending;

  const canContinue = useMemo(() => {
    const canHostAdvanceRound =
      allPlayersFinished || roundRemainingSeconds === 0;
    if (!isHost || !canHostAdvanceRound) return false;
    return currentRound < totalRounds;
  }, [
    allPlayersFinished,
    currentRound,
    isHost,
    roundRemainingSeconds,
    totalRounds,
  ]);

  const canFinish = useMemo(() => {
    const canHostAdvanceRound =
      allPlayersFinished || roundRemainingSeconds === 0;
    if (!isHost || !canHostAdvanceRound) return false;
    return currentRound >= totalRounds;
  }, [
    allPlayersFinished,
    currentRound,
    isHost,
    roundRemainingSeconds,
    totalRounds,
  ]);

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-3 text-center pt-8 pb-6">
          <CardTitle className="text-3xl font-black tracking-[0.18em] uppercase text-zinc-900 dark:text-white">
            Multiplayer Round {currentRound}/{totalRounds}
          </CardTitle>
          <div
            className={`mx-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-wider ${
              roundRemainingSeconds <= 10
                ? "border-red-400/60 text-red-500"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
            }`}
          >
            <span>Round Timer ({timePerRoundSeconds}s)</span>
            <span className="font-black text-sm tabular-nums">
              {formattedRoundTime}
            </span>
          </div>
          <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
            {userFinished
              ? `Great run. Round score: ${userScore}`
              : "Submit your guess before everyone else."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <GuessGridBoard
              wordLength={wordLength}
              guess={guess}
              setGuess={(value) => {
                const normalized = value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, wordLength);
                setGuess(normalized);
              }}
              isBusy={!canType || isTransitioning}
              previousGuesses={guesses}
              emptyRows={Math.max(0, 6 - guesses.length)}
            />

            <Button
              type="submit"
              disabled={
                !canType || isTransitioning || guess.length !== wordLength
              }
              className="w-full"
            >
              {submitGuessMutation.isPending ? "Submitting..." : "Submit Guess"}
            </Button>
          </form>

          {roomStatus === "playing" && roundRemainingSeconds === 0 && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-center text-sm text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
              {isHost
                ? "Time is up for this round. Continue when ready."
                : "Time is up for this round. Waiting for host to continue..."}
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Live Standings
            </div>
            <div className="mt-3 space-y-2">
              {players.map((player, index) => {
                const isCurrentUser = player.userId === userPlayer?.userId;
                return (
                  <div
                    key={player.userId}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                      isCurrentUser
                        ? "bg-blue-100 dark:bg-blue-900/40"
                        : "bg-zinc-100 dark:bg-zinc-800"
                    }`}
                  >
                    <div className="font-semibold truncate">
                      {index + 1}. {player.userName}
                    </div>
                    <div className="font-bold">{player.score}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {isHost && (
            <div className="flex gap-3">
              <Button
                type="button"
                className="flex-1"
                disabled={!canContinue || isTransitioning}
                onClick={() => void handleNextRound()}
              >
                {startNextRoundMutation.isPending ? (
                  <Loader />
                ) : (
                  "Start Next Round"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={!canFinish || isTransitioning}
                onClick={() => void handleFinishGame()}
              >
                {finishGameMutation.isPending ? <Loader /> : "Finish Game"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showFinalLeaderboard && (
        <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl border-2 border-yellow-400/40 bg-zinc-900 text-white">
            <CardContent className="pt-6 space-y-3">
              <div className="text-center text-3xl font-black tracking-[0.08em]">
                Final Leaderboard
              </div>
              {finalRanking.map((player, index) => (
                <div
                  key={player.userId}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/90 px-4 py-3 flex items-center justify-between"
                >
                  <div className="font-semibold truncate">
                    {index + 1}. {player.userName}
                  </div>
                  <div className="font-black text-green-300">
                    {player.score}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
