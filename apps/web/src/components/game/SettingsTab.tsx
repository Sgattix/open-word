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
import { DIFFICULTY_PRESETS, LANGUAGES } from "@/config";
import { calculateMultiplier } from "@/lib/utils";
import { IconX } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import CustomDifficultyForm from "./CustomDifficultyForm";

function SettingsTab() {
  const {
    settings,
    setSettings,
    startGameMutation,
    setShowSettings,
    language,
    setLanguage,
    customWordLength,
    customMaxAttempts,
    customHintsAllowed,
    customMultiplier,
  } = useGame();

  function handleStartGame() {
    startGameMutation.mutate({
      mode: "random",
      length: settings.wordLength,
      maxAttempts: settings.maxAttempts,
      hintsAllowed: settings.hintsAllowed,
      language,
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
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="space-y-3 bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-lg text-sm">
          <div className="font-semibold text-zinc-900 dark:text-white flex items-center justify-between">
            <span>{settings.difficulty.toUpperCase()} MODE</span>
            <span className="text-lg font-black text-[#6aaa64] flex items-center gap-0">
              <IconX className="stroke-[7px]" width={15} height={15} />
              {calculateMultiplier(
                settings.wordLength,
                settings.maxAttempts,
                settings.hintsAllowed,
              ).toFixed(2)}
            </span>
          </div>
          <div className="space-y-1 text-zinc-700 dark:text-zinc-300">
            {Object.entries({
              "Word Length": settings.wordLength,
              "Max Attempts": settings.maxAttempts,
              "Hints Allowed": settings.hintsAllowed,
            }).map(([label, value]) => (
              <div key={label}>
                <span className="font-medium">{label}:</span>{" "}
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {settings.difficulty === "custom" && <CustomDifficultyForm />}

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
