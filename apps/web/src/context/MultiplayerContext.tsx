"use client";
import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type MultiplayerContextType = {
  roomId: string | null;
  setRoomId: (id: string | null) => void;
  roomCode: string | null;
  setRoomCode: (code: string | null) => void;
  gameWord: string | null;
  setGameWord: (word: string | null) => void;
  gameStarted: boolean;
  setGameStarted: (started: boolean) => void;
  players: Array<{
    userId: string;
    userName: string;
    userImage: string | null;
    status: "playing" | "won" | "lost";
    guessesUsed: number;
    rank?: number;
    score: number;
  }>;
  setPlayers: (
    players: Array<{
      userId: string;
      userName: string;
      userImage: string | null;
      status: "playing" | "won" | "lost";
      guessesUsed: number;
      rank?: number;
      score: number;
    }>,
  ) => void;
  resetMultiplayer: () => void;
};

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(
  undefined,
);

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [gameWord, setGameWord] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState<
    Array<{
      userId: string;
      userName: string;
      userImage: string | null;
      status: "playing" | "won" | "lost";
      guessesUsed: number;
      rank?: number;
      score: number;
    }>
  >([]);

  const resetMultiplayer = () => {
    setRoomId(null);
    setRoomCode(null);
    setGameWord(null);
    setGameStarted(false);
    setPlayers([]);
  };

  return (
    <MultiplayerContext.Provider
      value={{
        roomId,
        setRoomId,
        roomCode,
        setRoomCode,
        gameWord,
        setGameWord,
        gameStarted,
        setGameStarted,
        players,
        setPlayers,
        resetMultiplayer,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error("useMultiplayer must be used within a MultiplayerProvider");
  }
  return context;
}
