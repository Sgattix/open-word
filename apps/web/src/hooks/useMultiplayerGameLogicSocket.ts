'use client';

import { authClient } from '@/lib/auth-client';
import { useMultiplayer } from '@/context/MultiplayerContext';
import { useGameSocket, type GuessResult, type LeaderboardEntry } from '@/hooks/useGameSocket';
import {
  useMultiplayerGameState,
  useMultiplayerUIState,
  useRoomStateSync,
  useRoundTransition,
  useLeaderboardSync,
  useFinalLeaderboardAnimation,
  useMultiplayerComputedState,
} from '@/hooks/useMultiplayerState';

/**
 * Socket.io-based multiplayer game logic hook
 * This is an alternative to useMultiplayerGameLogic that uses real-time Socket.io
 * events instead of tRPC polling for instant multiplayer updates.
 */
export function useMultiplayerGameLogicSocket() {
  const { roomId, players, setPlayers } = useMultiplayer();
  const { data: session } = authClient.useSession();

  // Socket.io connection management
  const {
    connected,
    guessResult,
    leaderboard,
    roomState,
    error,
    joinRoom,
    submitGuess,
    startGame,
  } = useGameSocket(session?.user?.id ?? null);

  // Game state management (same as before)
  const gameState = useMultiplayerGameState();
  const uiState = useMultiplayerUIState();

  // Sync room state from Socket.io (replaces tRPC polling)
  useRoomStateSync(roomState, gameState);

  // Sync leaderboard from Socket.io (replaces tRPC polling)
  useLeaderboardSync(leaderboard, setPlayers);

  // Handle round transitions
  useRoundTransition(roomState?.currentRound ?? 0, uiState.lastSeenRound, gameState, uiState);

  // Handle final leaderboard animation
  useFinalLeaderboardAnimation(roomState?.status ?? 'playing', players, uiState);

  // Compute derived state
  const computedState = useMultiplayerComputedState(
    gameState.guesses,
    roomState?.wordLength ?? 5,
    players,
    session ?? null
  );

  // Handle guess result from Socket.io
  const handleGuessResult = (result: GuessResult) => {
    gameState.setGuesses((prev) => [
      ...prev,
      {
        guess: gameState.guess.toUpperCase(),
        feedback: result.feedback,
      },
    ]);

    if (result.correct) {
      gameState.setUserFinished(true);
      gameState.setUserScore(result.guessesUsed);
    }
    gameState.setGuess('');
  };

  // Submit guess via Socket.io
  const handleSubmitGuess = (guess: string) => {
    if (!roomId || !connected) return;
    submitGuess(roomId, guess);
  };

  // Join room via Socket.io
  const handleJoinRoom = (code: string) => {
    joinRoom(code);
  };

  // Start game via Socket.io
  const handleStartGame = () => {
    if (!roomId || !connected) return;
    startGame(roomId);
  };

  // Handle errors
  if (error) {
    console.error('Socket.io error:', error);
  }

  return {
    // Connection status
    connected,
    error,

    // Game state
    gameState,
    uiState,
    computedState,
    players,

    // Real-time data from Socket.io
    leaderboard,
    guessResult,
    roomState,

    // Actions
    handleSubmitGuess,
    handleJoinRoom,
    handleStartGame,

    // Socket.io connection object (for advanced usage)
    socket: { connected, error },
  };
}
