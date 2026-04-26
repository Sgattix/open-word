"use client";

import { DIFFICULTY_PRESETS } from "@/config";
import type { GameSettings, GameState } from "@/types/game";
import React, { createContext, useContext, useMemo } from "react";
import {
  useGameFormState,
  useGameSettings,
  useGameSession,
  useGameUIState,
  useGameMutations,
  useGameState,
  computeFullGuess,
  useGameSubmitHandler,
} from "@/hooks/useGame";

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

/**
 * GameContext: composite wrapper that combines all game-related hooks.
 * This provides a single access point for all game state and mutations.
 * Components can still use individual hooks directly if they only need specific state.
 */
export const GameContext = createContext<any>(null);

export const GameContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Form state
  const formState = useGameFormState();

  // Settings state
  const settingsState = useGameSettings(DIFFICULTY_PRESETS.normal);

  // Session state (timing, hints, score)
  const sessionState = useGameSession();

  // UI visibility
  const { showSettings, setShowSettings } = useGameUIState();

  // API mutations
  const mutations = useGameMutations();

  // Live game state from server
  const { game, isLoading, isFetching } = useGameState(formState.gameId);

  // Compute full guess (includes hinted letters)
  const fullGuess = useMemo(
    () => computeFullGuess(formState.guess, game?.hintedLetters, game?.wordLength),
    [formState.guess, game?.hintedLetters, game?.wordLength],
  );

  // Handle guess submission
  const { handleSubmitGuess, canSubmitGuess, isBusy: isSubmitting } =
    useGameSubmitHandler(
      formState.gameId,
      game,
      fullGuess,
      mutations.submitGuessMutation,
      () => formState.setGuess(""),
    );

  // Reset all state
  const resetGameState = () => {
    formState.resetForm();
    settingsState.resetSettings();
    sessionState.resetSession();
    setShowSettings(true);
  };

  // Configure start game mutation with side effects
  React.useEffect(() => {
    const subscription = mutations.startGameMutation.status;
    if (
      mutations.startGameMutation.isSuccess &&
      mutations.startGameMutation.data
    ) {
      const data = mutations.startGameMutation.data;
      formState.setGameId(data.gameId);
      formState.setGuess("");
      sessionState.setGameStartTime(Date.now());
      sessionState.setHintsUsed(0);
      sessionState.setFinalScore(null);
    }
  }, [mutations.startGameMutation.data, mutations.startGameMutation.isSuccess]);

  // Compose final context value
  const contextValue = useMemo(
    () => ({
      // Form state
      gameId: formState.gameId,
      setGameId: formState.setGameId,
      guess: formState.guess,
      setGuess: formState.setGuess,

      // UI state
      showSettings,
      setShowSettings,

      // Settings state
      customWordLength: settingsState.customWordLength,
      setCustomWordLength: settingsState.setCustomWordLength,
      customMaxAttempts: settingsState.customMaxAttempts,
      setCustomMaxAttempts: settingsState.setCustomMaxAttempts,
      customHintsAllowed: settingsState.customHintsAllowed,
      setCustomHintsAllowed: settingsState.setCustomHintsAllowed,
      customMultiplier: settingsState.customMultiplier,
      setCustomMultiplier: settingsState.setCustomMultiplier,
      language: settingsState.language,
      setLanguage: settingsState.setLanguage,

      // Session state
      gameStartTime: sessionState.gameStartTime,
      setGameStartTime: sessionState.setGameStartTime,
      gameDuration: sessionState.gameDuration,
      setGameDuration: sessionState.setGameDuration,
      hintsUsed: sessionState.hintsUsed,
      setHintsUsed: sessionState.setHintsUsed,
      finalScore: sessionState.finalScore,
      setFinalScore: sessionState.setFinalScore,

      // API mutations
      startGameMutation: mutations.startGameMutation,
      useHintMutation: mutations.useHintMutation,
      saveGameMutation: mutations.saveGameMutation,
      submitGuessMutation: mutations.submitGuessMutation,

      // Computed state
      game,
      fullGuess,
      canSubmitGuess,
      isBusy: isSubmitting || mutations.useHintMutation.isPending || isFetching,

      // Handlers
      handleSubmitGuess,
      resetGameState,

      // Legacy: provide settings object for backwards compatibility
      settings: DIFFICULTY_PRESETS.normal,
      setSettings: () => {},
    }),
    [
      formState.gameId,
      formState.guess,
      settingsState.customWordLength,
      settingsState.customMaxAttempts,
      settingsState.customHintsAllowed,
      settingsState.customMultiplier,
      settingsState.language,
      sessionState.gameStartTime,
      sessionState.gameDuration,
      sessionState.hintsUsed,
      sessionState.finalScore,
      mutations.useHintMutation,
      mutations.saveGameMutation,
      mutations.submitGuessMutation,
      game,
      fullGuess,
      canSubmitGuess,
      isSubmitting,
      isFetching,
      handleSubmitGuess,
      resetGameState,
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

