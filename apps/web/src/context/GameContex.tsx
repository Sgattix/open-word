"use client";
import { DEFAULT_WORD_LENGTH, DIFFICULTY_PRESETS } from "@/config";
import { calculateCustomMultiplier } from "@/lib/utils";
import type { GameScore, GameSettings, GameState } from "@/types/game";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";

export const GameContext = createContext<{
  gameId: string | null;
  setGameId: React.Dispatch<React.SetStateAction<string | null>>;
  guess: string;
  setGuess: React.Dispatch<React.SetStateAction<string>>;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  gameStartTime: number | null;
  setGameStartTime: React.Dispatch<React.SetStateAction<number | null>>;
  gameDuration: number;
  setGameDuration: React.Dispatch<React.SetStateAction<number>>;
  hintsUsed: number;
  setHintsUsed: React.Dispatch<React.SetStateAction<number>>;
  finalScore: GameScore | null;
  setFinalScore: React.Dispatch<React.SetStateAction<GameScore | null>>;
  customWordLength: number;
  setCustomWordLength: React.Dispatch<React.SetStateAction<number>>;
  customMaxAttempts: number;
  setCustomMaxAttempts: React.Dispatch<React.SetStateAction<number>>;
  customHintsAllowed: number;
  setCustomHintsAllowed: React.Dispatch<React.SetStateAction<number>>;
  customMultiplier: number;
  setCustomMultiplier: React.Dispatch<React.SetStateAction<number>>;
  startGameMutation: ReturnType<typeof useMutation<any, any, any, any>>;
  isBusy: boolean;
  canSubmitGuess: boolean;
  game: GameState | null;
  handleSubmitGuess: (event: React.FormEvent<HTMLFormElement>) => void;
}>({
  gameId: null,
  setGameId: () => {},
  guess: "",
  setGuess: () => {},
  showSettings: true,
  setShowSettings: () => {},
  settings: DIFFICULTY_PRESETS.normal,
  setSettings: () => {},
  gameStartTime: null,
  setGameStartTime: () => {},
  gameDuration: 0,
  setGameDuration: () => {},
  hintsUsed: 0,
  setHintsUsed: () => {},
  finalScore: null,
  setFinalScore: () => {},
  customWordLength: 5,
  setCustomWordLength: () => {},
  customMaxAttempts: 6,
  setCustomMaxAttempts: () => {},
  customHintsAllowed: 2,
  setCustomHintsAllowed: () => {},
  customMultiplier: calculateCustomMultiplier(5, 6, 2),
  setCustomMultiplier: () => {},
  startGameMutation: {} as ReturnType<typeof useMutation>,
  isBusy: false,
  canSubmitGuess: false,
  game: {
    gameId: "",
    wordLength: 5,
    attemptsLeft: 6,
    status: "playing",
    guesses: [],
    revealedWord: null,
  },
  handleSubmitGuess: () => {},
});

export const GameContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameId, setGameId] = useState<string | null>(null);
  const [guess, setGuess] = useState("");
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<GameSettings>(
    DIFFICULTY_PRESETS.normal,
  );
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [gameDuration, setGameDuration] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [finalScore, setFinalScore] = useState<GameScore | null>(null);
  const [customWordLength, setCustomWordLength] = useState(5);
  const [customMaxAttempts, setCustomMaxAttempts] = useState(6);
  const [customHintsAllowed, setCustomHintsAllowed] = useState(2);
  const [customMultiplier, setCustomMultiplier] = useState(
    calculateCustomMultiplier(5, 6, 2),
  );
  const startGameMutation = useMutation({
    ...trpc.solo.startGame.mutationOptions(),
    onSuccess: (data) => {
      setGameId(data.gameId);
      setGuess("");
      setGameStartTime(Date.now());
      setHintsUsed(0);
      setFinalScore(null);
    },
  });

  const gameStateQuery = useQuery(
    trpc.solo.getGameState.queryOptions(
      {
        gameId: gameId ?? "",
      },
      {
        enabled: Boolean(gameId),
      },
    ),
  );

  const submitGuessMutation = useMutation({
    ...trpc.solo.submitGuess.mutationOptions(),
    onSuccess: () => {
      setGuess("");
      void gameStateQuery.refetch();
    },
  });
  const game = (gameStateQuery.data ?? null) as GameState | null;

  const isBusy =
    startGameMutation.isPending ||
    submitGuessMutation.isPending ||
    gameStateQuery.isFetching;
  const canSubmitGuess =
    Boolean(gameId) &&
    game?.status === "playing" &&
    guess.trim().length === (game?.wordLength ?? DEFAULT_WORD_LENGTH);

  function handleSubmitGuess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!gameId) {
      return;
    }

    submitGuessMutation.mutate({
      gameId,
      guess,
    });
  }

  return (
    <GameContext.Provider
      value={{
        gameId,
        setGameId,
        guess,
        setGuess,
        showSettings,
        setShowSettings,
        settings,
        setSettings,
        gameStartTime,
        setGameStartTime,
        gameDuration,
        setGameDuration,
        hintsUsed,
        setHintsUsed,
        finalScore,
        setFinalScore,
        customWordLength,
        setCustomWordLength,
        customMaxAttempts,
        setCustomMaxAttempts,
        customHintsAllowed,
        setCustomHintsAllowed,
        customMultiplier,
        setCustomMultiplier,
        startGameMutation,
        isBusy,
        canSubmitGuess,
        game,
        handleSubmitGuess,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameContextProvider");
  }
  return context;
};
