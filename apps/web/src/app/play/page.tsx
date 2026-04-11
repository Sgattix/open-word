"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { calculateScore } from "@/lib/utils";
import { runConfettiAnimation } from "@/lib/utils";
import { useGame } from "@/context/GameContex";
import SettingsTab from "@/components/game/SettingsTab";
import GameTab from "@/components/game/GameTab";
import ScoreTab from "@/components/game/ScoreTab";

function PlayPage() {
  const {
    gameId,
    gameStartTime,
    setFinalScore,
    setGameDuration,
    gameDuration,
    settings,
    showSettings,
    finalScore,
    hintsUsed,
    game,
  } = useGame();

  useEffect(() => {
    if (!gameStartTime || !gameId || game?.status !== "playing") return;
    const interval = setInterval(() => {
      setGameDuration(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 100);
    return () => clearInterval(interval);
  }, [gameStartTime, gameId, game?.status]);

  useEffect(() => {
    if (!game?.status || (game.status !== "won" && game.status !== "lost")) {
      return;
    }

    if (!finalScore) {
      if (game.status === "won") {
        runConfettiAnimation(500);
      }
      const score = calculateScore(game, settings, hintsUsed, gameDuration);
      setFinalScore(score);
    }
  }, [game?.gameId, game?.status]);

  return (
    <main
      className={
        "relative mx-auto flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 bg-white dark:bg-zinc-900 transition-all duration-500"
      }
    >
      <Card className="relative w-full max-w-2xl border-0 bg-white dark:bg-zinc-900 shadow-none">
        {showSettings && !gameId && <SettingsTab />}

        {game && game.status === "playing" && !finalScore && <GameTab />}

        {finalScore && <ScoreTab />}
      </Card>
    </main>
  );
}

export default PlayPage;
