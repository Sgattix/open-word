"use client";

import { authClient } from "@/lib/auth-client";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { trpc, queryClient } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

type GuessFeedback = "correct" | "present" | "absent";
type GuessEntry = { guess: string; feedback: GuessFeedback[] };

export function useMultiplayerGameLogic() {
  const { roomId, players, setPlayers } = useMultiplayer();
  const { data: session } = authClient.useSession();

  const [guess, setGuess] = useState("");
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [userFinished, setUserFinished] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [wordLength, setWordLength] = useState(5);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [isHost, setIsHost] = useState(false);
  const [lastSeenRound, setLastSeenRound] = useState(0);
  const [roomStatus, setRoomStatus] = useState<string>("playing");
  const [showFinalLeaderboard, setShowFinalLeaderboard] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

  const submitGuessMutation = useMutation({
    mutationFn: (input: { roomId: string; guess: string }) =>
      trpc.multiplayer.submitGuess.mutate(input),
    onSuccess: (data: any) => {
      setGuesses((prev) => [
        ...prev,
        {
          guess: guess.toUpperCase(),
          feedback: data.feedback,
        },
      ]);

      if (data.correct) {
        setUserFinished(true);
        setUserScore(data.score);
      }
      setGuess("");
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const endRoundMutation = useMutation({
    mutationFn: (input: { roomId: string }) =>
      trpc.multiplayer.endRound.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState", roomId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const startNextRoundMutation = useMutation({
    mutationFn: (input: { roomId: string }) =>
      trpc.multiplayer.startGame.mutate(input),
    onSuccess: () => {
      setGuesses([]);
      setUserFinished(false);
      setUserScore(0);
      setGuess("");
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState", roomId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const finishGameMutation = useMutation({
    mutationFn: (input: { roomId: string }) =>
      trpc.multiplayer.finishGame.mutate(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState", roomId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getLeaderboard", roomId],
      });
    },
  });

  const getLeaderboard = useQuery({
    queryKey: ["multiplayer", "getLeaderboard", roomId],
    queryFn: () =>
      trpc.multiplayer.getLeaderboard.query({ roomId: roomId || "" }),
    enabled: !!roomId,
    refetchInterval: 500,
  });

  const getRoomState = useQuery({
    queryKey: ["multiplayer", "getRoomState", roomId],
    queryFn: () =>
      trpc.multiplayer.getRoomState.query({ roomId: roomId || "" }),
    enabled: !!roomId,
    refetchInterval: 1000,
  });

  useEffect(() => {
    if (getRoomState.data) {
      setWordLength(getRoomState.data.wordLength);
      setCurrentRound(getRoomState.data.currentRound);
      setTotalRounds(getRoomState.data.numRounds);
      setIsHost(getRoomState.data.hostId === session?.user?.id);
      setRoomStatus(getRoomState.data.status);
    }
  }, [getRoomState.data, session?.user?.id]);

  useEffect(() => {
    if (currentRound > 0 && currentRound !== lastSeenRound) {
      setGuesses([]);
      setGuess("");
      setUserFinished(false);
      setUserScore(0);
      setLastSeenRound(currentRound);
    }
  }, [currentRound, lastSeenRound]);

  useEffect(() => {
    if (getLeaderboard.data) {
      setPlayers(
        getLeaderboard.data.map((p) => ({
          userId: p.userId,
          userName: p.userName,
          userImage: p.userImage,
          status: p.status as "won" | "lost" | "playing",
          guessesUsed: p.guessesUsed,
          rank: p.rank,
          score: p.score,
        })),
      );
    }
  }, [getLeaderboard.data, setPlayers]);

  useEffect(() => {
    if (roomStatus === "finished" && !showFinalLeaderboard) {
      setShowFinalLeaderboard(true);
      setRevealedCount(0);
    }
  }, [roomStatus, showFinalLeaderboard]);

  useEffect(() => {
    if (!showFinalLeaderboard) return;

    const interval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= players.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [showFinalLeaderboard, players.length]);

  const allPlayersFinished =
    players.length > 0 && players.every((p) => p.status === "won");

  const userPlayer = useMemo(
    () => players.find((p) => p.userId === session?.user?.id),
    [players, session?.user?.id],
  );

  const displayWord = useMemo(() => {
    const correctLetters = new Map<number, string>();
    for (const g of guesses) {
      for (let i = 0; i < g.feedback.length; i++) {
        if (g.feedback[i] === "correct") {
          correctLetters.set(i, g.guess[i]!);
        }
      }
    }

    return Array.from({ length: wordLength })
      .map((_, i) => correctLetters.get(i) || "_")
      .join(" ");
  }, [guesses, wordLength]);

  const finalRanking = useMemo(() => {
    return [...players].sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;
      return (a.rank ?? 999) - (b.rank ?? 999);
    });
  }, [players]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !guess.trim() || userFinished) return;
    if (guess.trim().length !== wordLength) return;

    submitGuessMutation.mutate({
      roomId,
      guess: guess.trim().toUpperCase(),
    });
  }

  async function handleNextRound() {
    if (!roomId) return;
    try {
      await endRoundMutation.mutateAsync({ roomId });
      await startNextRoundMutation.mutateAsync({ roomId });
    } catch (error) {
      console.error("Error transitioning to next round:", error);
    }
  }

  async function handleFinishGame() {
    if (!roomId) return;
    try {
      await endRoundMutation.mutateAsync({ roomId });
      await finishGameMutation.mutateAsync({ roomId });
    } catch (error) {
      console.error("Error finishing game:", error);
    }
  }

  return {
    allPlayersFinished,
    currentRound,
    displayWord,
    endRoundMutation,
    finalRanking,
    finishGameMutation,
    guess,
    guesses,
    handleFinishGame,
    handleNextRound,
    handleSubmit,
    isHost,
    players,
    revealedCount,
    roomStatus,
    session,
    setGuess,
    showFinalLeaderboard,
    startNextRoundMutation,
    submitGuessMutation,
    totalRounds,
    userFinished,
    userPlayer,
    userScore,
    wordLength,
  };
}
