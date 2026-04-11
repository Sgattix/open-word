"use client";
import { DEFAULT_WORD_LENGTH, DIFFICULTY_PRESETS } from "@/config";
import { calculateMultiplier } from "@/lib/utils";
import type { GameScore, GameSettings, GameState } from "@/types/game";
import { trpc, queryClient } from "@/utils/trpc";
import { createContext, useContext, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

type SaveGameInput = {
  difficulty: string;
  wordLength: number;
  guessWord: string;
  status: "won" | "lost";
  guessesUsed: number;
  attemptsLeft: number;
  hintsUsed: number;
  timeTaken: number;
  score: number;
  attemptBonus: number;
  timeBonus: number;
  difficultyMultiplier: number;
  guesses: Array<{
    guess: string;
    feedback: Array<"correct" | "present" | "absent">;
  }>;
};

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
  useHintMutation: ReturnType<typeof useMutation<any, any, any, any>>;
  saveGameMutation: ReturnType<typeof useMutation<any, any, any, any>>;
  isBusy: boolean;
  canSubmitGuess: boolean;
  game: GameState | null;
  language: string;
  handleSubmitGuess: (event: React.SubmitEvent<HTMLFormElement>) => void;
  setLanguage: React.Dispatch<React.SetStateAction<string>>;
  resetGameState: () => void;
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
  customMultiplier: calculateMultiplier(5, 6, 2),
  setCustomMultiplier: () => {},
  startGameMutation: {} as ReturnType<typeof useMutation>,
  useHintMutation: {} as ReturnType<typeof useMutation>,
  saveGameMutation: {} as ReturnType<typeof useMutation>,
  isBusy: false,
  canSubmitGuess: false,
  language: "en",
  game: {
    gameId: "",
    wordLength: 5,
    attemptsLeft: 6,
    status: "playing",
    guesses: [],
    revealedWord: null,
    hintedLetters: {},
  },
  handleSubmitGuess: () => {},
  setLanguage: () => {},
  resetGameState: () => {},
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
    calculateMultiplier(5, 6, 2),
  );
  const [language, setLanguage] = useState("en");

  const startGameMutation = useMutation({
    mutationFn: (input: {
      difficulty: string;
      wordLength: number;
      maxAttempts: number;
      hintsAllowed: number;
      language: string;
    }) => trpc.solo.startGame.mutate(input),
    onSuccess: (data: any) => {
      setGameId(data.gameId);
      setGuess("");
      setGameStartTime(Date.now());
      setHintsUsed(0);
      setFinalScore(null);
    },
  });

  const gameStateQuery = useQuery({
    queryKey: ["solo", "getGameState", gameId],
    queryFn: () => trpc.solo.getGameState.query({ gameId: gameId ?? "" }),
    enabled: Boolean(gameId),
  });

  const submitGuessMutation = useMutation({
    mutationFn: (input: { gameId: string; guess: string }) =>
      trpc.solo.submitGuess.mutate(input),
    onSuccess: () => {
      setGuess("");
      void queryClient.invalidateQueries({
        queryKey: ["solo", "getGameState", gameId],
      });
    },
  });

  const useHintMutation = useMutation({
    mutationFn: (input: { gameId: string }) => trpc.solo.useHint.mutate(input),
    onSuccess: (data: any) => {
      setHintsUsed((prev) => prev + 1);
      void queryClient.invalidateQueries({
        queryKey: ["solo", "getGameState", gameId],
      });
    },
  });

  const saveGameMutation = useMutation({
    mutationFn: (input: SaveGameInput) => trpc.solo.saveGame.mutate(input),
  });

  const game = (gameStateQuery.data ?? null) as GameState | null;

  const isBusy =
    startGameMutation.isPending ||
    submitGuessMutation.isPending ||
    useHintMutation.isPending ||
    gameStateQuery.isFetching;

  const fullGuess = (() => {
    if (!game?.hintedLetters || Object.keys(game.hintedLetters).length === 0) {
      return guess;
    }

    const chars = Array(game?.wordLength ?? DEFAULT_WORD_LENGTH).fill("_");

    for (const [position, letter] of Object.entries(game.hintedLetters)) {
      chars[parseInt(position)] = letter;
    }

    let guessIdx = 0;
    for (let i = 0; i < (game?.wordLength ?? DEFAULT_WORD_LENGTH); i++) {
      if (!(i in game.hintedLetters) && guessIdx < guess.length) {
        chars[i] = guess[guessIdx];
        guessIdx++;
      }
    }

    return chars.join("").replace(/_/g, "");
  })();

  const canSubmitGuess =
    Boolean(gameId) &&
    game?.status === "playing" &&
    fullGuess.length === (game?.wordLength ?? DEFAULT_WORD_LENGTH);

  function handleSubmitGuess(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!gameId || !fullGuess) {
      return;
    }

    submitGuessMutation.mutate({
      gameId,
      guess: fullGuess,
    });
  }

  const resetGameState = () => {
    setGameId(null);
    setGuess("");
    setShowSettings(true);
    setSettings(DIFFICULTY_PRESETS.normal);
    setGameStartTime(null);
    setGameDuration(0);
    setHintsUsed(0);
    setFinalScore(null);
    setCustomWordLength(5);
    setCustomMaxAttempts(6);
    setCustomHintsAllowed(2);
    setCustomMultiplier(calculateMultiplier(5, 6, 2));
    setLanguage("en");
  };

  const contextValue = useMemo(
    () => ({
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
      useHintMutation,
      saveGameMutation,
      isBusy,
      canSubmitGuess,
      game,
      handleSubmitGuess,
      language,
      setLanguage,
      resetGameState,
    }),
    [
      gameId,
      guess,
      showSettings,
      settings,
      gameStartTime,
      gameDuration,
      hintsUsed,
      finalScore,
      customWordLength,
      customMaxAttempts,
      customHintsAllowed,
      customMultiplier,
      startGameMutation,
      useHintMutation,
      saveGameMutation,
      isBusy,
      canSubmitGuess,
      game,
      language,
    ],
  );

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameContextProvider");
  }
  return context;
};
