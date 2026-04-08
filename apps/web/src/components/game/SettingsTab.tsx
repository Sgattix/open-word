import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import DifficultyTabber from "@/components/game/DifficultyTabber";
import type { Difficulty } from "@/types";
import { useGame } from "@/context/GameContex";
import { DIFFICULTY_PRESETS } from "@/config";
import { calculateCustomMultiplier } from "@/lib/utils";

function SettingsTab() {
  const {
    settings,
    setSettings,
    startGameMutation,
    setShowSettings,
    customWordLength,
    customMaxAttempts,
    customHintsAllowed,
    customMultiplier,
    setCustomMultiplier,
    setCustomWordLength,
    setCustomMaxAttempts,
    setCustomHintsAllowed,
  } = useGame();

  function handleStartGame() {
    startGameMutation.mutate({
      mode: "random",
      length: settings.wordLength,
    });
    setShowSettings(false);
  }

  function handleDifficultySelect(difficulty: Difficulty) {
    if (difficulty === "custom") {
      setSettings({
        difficulty: "custom",
        wordLength: customWordLength,
        maxAttempts: customMaxAttempts,
        hintsAllowed: customHintsAllowed,
        customMultiplier,
      });
    } else {
      setSettings(DIFFICULTY_PRESETS[difficulty]);
    }
  }

  function handleCustomSettingChange() {
    const newMultiplier = calculateCustomMultiplier(
      customWordLength,
      customMaxAttempts,
      customHintsAllowed,
    );
    setCustomMultiplier(newMultiplier);
    setSettings({
      difficulty: "custom",
      wordLength: customWordLength,
      maxAttempts: customMaxAttempts,
      hintsAllowed: customHintsAllowed,
      customMultiplier: newMultiplier,
    });
  }
  return (
    <>
      <CardHeader className="space-y-3 text-center pt-8 pb-6">
        <CardTitle className="text-4xl font-black tracking-[0.18em] uppercase text-zinc-900 dark:text-white">
          Select Difficulty
        </CardTitle>
        <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
          Choose your challenge level
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <DifficultyTabber
          settings={settings}
          onDifficultyChange={handleDifficultySelect}
        />
        <div className="space-y-3 bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-lg text-sm">
          <div className="font-semibold text-zinc-900 dark:text-white flex items-center justify-between">
            <span>{settings.difficulty.toUpperCase()} MODE</span>
            {settings.difficulty === "custom" && (
              <span className="text-lg font-black text-[#6aaa64]">
                ×{customMultiplier}
              </span>
            )}
          </div>
          <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
            <div>
              • Word Length:{" "}
              <span className="font-bold">{settings.wordLength} letters</span>
            </div>
            <div>
              • Max Attempts:{" "}
              <span className="font-bold">{settings.maxAttempts}</span>
            </div>
            <div>
              • Hints Allowed:{" "}
              <span className="font-bold">{settings.hintsAllowed}</span>
            </div>
          </div>
        </div>

        {settings.difficulty === "custom" && (
          <div className="space-y-4 border border-zinc-300 dark:border-zinc-600 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Word Length
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomWordLength(Math.max(3, customWordLength - 1));
                      handleCustomSettingChange();
                    }}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white flex-1 text-center">
                    {customWordLength}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomWordLength(Math.min(8, customWordLength + 1));
                      handleCustomSettingChange();
                    }}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Max Attempts
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMaxAttempts(Math.max(3, customMaxAttempts - 1));
                      handleCustomSettingChange();
                    }}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white flex-1 text-center">
                    {customMaxAttempts}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMaxAttempts(Math.min(12, customMaxAttempts + 1));
                      handleCustomSettingChange();
                    }}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Hints Allowed
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHintsAllowed(
                        Math.max(0, customHintsAllowed - 1),
                      );
                      handleCustomSettingChange();
                    }}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white flex-1 text-center">
                    {customHintsAllowed}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomHintsAllowed(
                        Math.min(5, customHintsAllowed + 1),
                      );
                      handleCustomSettingChange();
                    }}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-zinc-200 dark:bg-zinc-700/50 p-3 rounded text-center">
              <div className="text-xs text-zinc-700 dark:text-zinc-400 uppercase font-semibold">
                Difficulty Multiplier
              </div>
              <div className="text-2xl font-black text-[#6aaa64] mt-1">
                ×{customMultiplier}
              </div>
            </div>
          </div>
        )}

        <Button
          disabled={startGameMutation.isPending}
          onClick={handleStartGame}
          className="w-full h-12 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold tracking-wide uppercase hover:opacity-90 transition-opacity"
        >
          {startGameMutation.isPending ? "Starting..." : "Start Game"}
        </Button>
      </CardContent>
    </>
  );
}

export default SettingsTab;
