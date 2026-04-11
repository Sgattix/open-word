import GuessGridBoard from "@/components/shared/GuessGridBoard";
import { useMemo } from "react";
import { useGame } from "@/context/GameContex";

function GuessGrid() {
  const { guess, setGuess, game, isBusy } = useGame();

  const emptyRows = !game
    ? 0
    : game.status === "playing"
      ? Math.max(0, game.attemptsLeft - 1)
      : game.attemptsLeft;

  const hintedLetters = useMemo(() => {
    return (game?.hintedLetters ?? {}) as Record<number, string>;
  }, [game?.hintedLetters]);

  return game ? (
    <GuessGridBoard
      wordLength={game.wordLength}
      guess={guess}
      setGuess={setGuess}
      isBusy={isBusy}
      previousGuesses={game.guesses}
      hintedLetters={hintedLetters}
      emptyRows={emptyRows}
    />
  ) : null;
}

export default GuessGrid;
