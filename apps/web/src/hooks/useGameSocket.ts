'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface GuessResult {
  correct: boolean;
  feedback: ('correct' | 'present' | 'absent')[];
  guessesUsed: number;
}

export interface LeaderboardEntry {
  userId: string;
  status: 'playing' | 'won' | 'lost';
  guessesUsed: number;
  score: number;
  rank: number;
}

export interface RoomUpdate {
  roomId: string;
  status: string;
  currentRound: number;
  numRounds: number;
  wordLength: number;
  players: Array<{
    userId: string;
    userName: string;
    userImage: string | null;
    status: string;
    guessesUsed: number;
    rank: number | null;
    finalScore: number | null;
  }>;
}

/**
 * Hook for Socket.io connection and game events
 */
export function useGameSocket(userId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [guessResult, setGuessResult] = useState<GuessResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [roomState, setRoomState] = useState<RoomUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError(error.message);
    });

    // Game events
    newSocket.on('guess:result', (data: GuessResult) => {
      setGuessResult(data);
    });

    newSocket.on('leaderboard:update', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    newSocket.on('room:update', (data: RoomUpdate) => {
      setRoomState(data);
    });

    newSocket.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  // Actions
  const joinRoom = useCallback(
    (code: string) => {
      if (!socket || !userId) return;
      socket.emit('room:join', { code, userId });
    },
    [socket, userId]
  );

  const submitGuess = useCallback(
    (roomId: string, guess: string) => {
      if (!socket) return;
      socket.emit('guess:submit', { roomId, guess });
    },
    [socket]
  );

  const startGame = useCallback(
    (roomId: string) => {
      if (!socket) return;
      socket.emit('game:start', { roomId });
    },
    [socket]
  );

  return {
    socket,
    connected,
    guessResult,
    leaderboard,
    roomState,
    error,
    joinRoom,
    submitGuess,
    startGame,
  };
}
