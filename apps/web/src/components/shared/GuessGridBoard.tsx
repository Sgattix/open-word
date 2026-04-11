import { Input } from "@base-ui/react/input";
import WordWrapper from "@/components/shared/WordWrapper";
import { useMemo, useRef } from "react";

type FeedbackCell = "correct" | "present" | "absent";

type GuessEntry = {
  guess: string;
  feedback: FeedbackCell[];
};

type GuessGridBoardProps = {
  wordLength: number;
  guess: string;
  setGuess: (nextGuess: string) => void;
  isBusy: boolean;
  previousGuesses?: GuessEntry[];
  hintedLetters?: Record<number, string>;
  emptyRows?: number;
};

export default function GuessGridBoard({
  wordLength,
  guess,
  setGuess,
  isBusy,
  previousGuesses = [],
  hintedLetters = {},
  emptyRows = 0,
}: GuessGridBoardProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const hintedPositions = useMemo(
    () => new Set(Object.keys(hintedLetters).map(Number)),
    [hintedLetters],
  );

  const editablePositions = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < wordLength; i++) {
      if (!hintedPositions.has(i)) positions.push(i);
    }
    return positions;
  }, [wordLength, hintedPositions]);

  const displayChars = useMemo(() => {
    const chars = Array(wordLength).fill("") as string[];
    for (const [position, letter] of Object.entries(hintedLetters)) {
      chars[Number(position)] = letter;
    }
    for (let i = 0; i < editablePositions.length; i++) {
      chars[editablePositions[i]!] = guess[i] ?? "";
    }
    return chars;
  }, [wordLength, hintedLetters, editablePositions, guess]);

  const setGuessFromDisplayChars = (nextChars: string[]) => {
    setGuess(
      editablePositions.map((position) => nextChars[position] ?? "").join(""),
    );
  };

  const handleSlotChange = (position: number, rawValue: string) => {
    if (hintedPositions.has(position)) return;
    const letter = /^[A-Za-z]$/.test(rawValue.slice(-1))
      ? rawValue.slice(-1).toUpperCase()
      : "";
    const nextChars = [...displayChars];
    nextChars[position] = letter;
    setGuessFromDisplayChars(nextChars);

    if (letter) {
      const nextPosition =
        editablePositions[editablePositions.indexOf(position) + 1];
      if (nextPosition !== undefined) {
        inputRefs.current[nextPosition]?.focus();
      }
    }
  };

  const handleSlotKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    position: number,
  ) => {
    if (hintedPositions.has(position) || event.key !== "Backspace") return;

    if (displayChars[position]) {
      event.preventDefault();
      const nextChars = [...displayChars];
      nextChars[position] = "";
      setGuessFromDisplayChars(nextChars);
      return;
    }

    const previousPosition =
      editablePositions[editablePositions.indexOf(position) - 1];
    if (previousPosition !== undefined) {
      event.preventDefault();
      inputRefs.current[previousPosition]?.focus();
    }
  };

  return (
    <div className="w-full space-y-2 flex flex-col items-center">
      {previousGuesses.length > 0
        ? previousGuesses.map((entry, index) => (
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

      <div className="flex items-center justify-center py-2">
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: wordLength }).map((_, index) => {
            const isHinted = hintedPositions.has(index);

            if (isHinted) {
              return (
                <div
                  key={`hint-${index}`}
                  className="h-14 w-14 md:h-16 md:w-16 border border-blue-400 dark:border-blue-600 bg-blue-100 dark:bg-blue-900 text-zinc-900 dark:text-white text-center text-xl md:text-2xl font-bold uppercase rounded-lg flex items-center justify-center"
                >
                  {displayChars[index]}
                </div>
              );
            }

            return (
              <Input
                key={`slot-${index}`}
                ref={(element) => {
                  if (inputRefs.current) {
                    inputRefs.current[index] = element as HTMLInputElement | null;
                  }
                }}
                type="text"
                inputMode="text"
                maxLength={1}
                value={displayChars[index]}
                onChange={(event) => handleSlotChange(index, event.currentTarget.value)}
                onKeyDown={(event) => handleSlotKeyDown(event, index)}
                onFocus={(event) => {
                  event.currentTarget.select();
                }}
                disabled={isBusy}
                aria-label={`Guess letter ${index + 1}`}
                className="h-14 w-14 md:h-16 md:w-16 border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-center text-xl md:text-2xl font-bold uppercase rounded-lg transition-colors duration-300 outline-none focus:border-zinc-900 dark:focus:border-white"
              />
            );
          })}
        </div>
      </div>

      {Array.from({ length: emptyRows }).map((_, rowIndex) => (
        <div
          key={`empty-${rowIndex}`}
          className="flex items-center justify-center gap-1.5"
        >
          {Array.from({ length: wordLength }).map((__, colIndex) => (
            <span
              key={`empty-${rowIndex}-${colIndex}`}
              className="h-14 w-14 md:h-16 md:w-16 border border-zinc-300 dark:border-zinc-600 bg-white/95 dark:bg-zinc-800/95 rounded-lg"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
