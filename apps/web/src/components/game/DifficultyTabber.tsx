import { Button } from "@/components/ui/button";
import { DIFFICULTY_PRESETS } from "@/config/config";
import { cn } from "@/lib/utils";
import type { Difficulty, GameSettings } from "@/types/game";

function DifficultyTabber({
  settings,
  onDifficultyChange,
}: {
  settings: GameSettings;
  onDifficultyChange: (difficulty: Difficulty) => void;
}) {
  const handleDifficultySelect = (difficulty: Difficulty) => {
    onDifficultyChange(difficulty);
  };

  return (
    <div className="flex flex-wrap gap-3 w-full justify-center">
      {Object.keys(DIFFICULTY_PRESETS)
        .concat(["custom"])
        .map((diff) => (
          <Button
            key={diff}
            onClick={() => handleDifficultySelect(diff as Difficulty)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all text-sm font-bold uppercase tracking-wide flex flex-col h-auto",
              settings.difficulty === diff
                ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white hover:border-zinc-900 dark:hover:border-white",
            )}
          >
            <div>{diff}</div>
            <div className="text-xs mt-1 opacity-75">
              {diff === "custom"
                ? `${settings.wordLength} letters`
                : `${
                    DIFFICULTY_PRESETS[diff as Exclude<Difficulty, "custom">]
                      .wordLength
                  } letters`}
            </div>
          </Button>
        ))}
    </div>
  );
}

export default DifficultyTabber;
