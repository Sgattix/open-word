import { useGame } from "@/context/GameContex";
import { calculateMultiplier } from "@/lib/utils";

function CustomDifficultyForm() {
  const {
    customWordLength,
    setCustomWordLength,
    customMaxAttempts,
    setCustomMaxAttempts,
    customHintsAllowed,
    setCustomHintsAllowed,
    customMultiplier,
    setCustomMultiplier,
    setSettings,
  } = useGame();

  function handleCustomSettingChange() {
    const newMultiplier = calculateMultiplier(
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
                setCustomHintsAllowed(Math.max(0, customHintsAllowed - 1));
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
                setCustomHintsAllowed(Math.min(5, customHintsAllowed + 1));
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
  );
}

export default CustomDifficultyForm;
