"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { trpc, queryClient } from "@/utils/trpc";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { IconCopy, IconPlayerPlay } from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";
import Loader from "../shared/loader";
import { useQuery, useMutation } from "@tanstack/react-query";

export function MultiplayerWaitingRoom() {
  const { roomCode, roomId, setGameStarted, players, setPlayers, setGameWord } =
    useMultiplayer();
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: session } = authClient.useSession();

  const getRoomState = useQuery({
    queryKey: ["multiplayer", "getRoomState", roomId],
    queryFn: () =>
      trpc.multiplayer.getRoomState.query({ roomId: roomId || "" }),
    enabled: !!roomId,
    refetchInterval: 1000,
  });

  const startGameMutation = useMutation({
    mutationFn: (input: { roomId: string }) =>
      trpc.multiplayer.startGame.mutate(input),
    onSuccess: () => {
      setGameStarted(true);
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState"],
      });
    },
  });

  useEffect(() => {
    if (getRoomState.data && session?.user) {
      setPlayers(
        getRoomState.data.players.map((player: any) => ({
          userId: player.userId,
          userName: player.userName,
          userImage: player.userImage,
          status: player.status as "won" | "lost" | "playing",
          guessesUsed: player.guessesUsed,
          rank: player.rank || undefined,
          score: player.finalScore,
        })),
      );
      setIsHost(getRoomState.data.hostId === session.user.id || false);

      if (getRoomState.data.status === "playing") {
        if (getRoomState.data.gameWord) {
          setGameWord(getRoomState.data.gameWord);
        }
        setGameStarted(true);
      }
    }
  }, [
    getRoomState.data,
    session?.user,
    setPlayers,
    setGameStarted,
    setGameWord,
  ]);

  function handleCopyCode() {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleStartGame() {
    if (roomId && isHost) {
      startGameMutation.mutate({ roomId });
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-3 text-center pt-8 pb-6">
        <CardTitle className="text-3xl font-black tracking-[0.18em] uppercase text-zinc-900 dark:text-white">
          Waiting Room
        </CardTitle>
        <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
          Share this code with friends
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Room Code */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-4 text-center">
            <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
              Room Code
            </div>
            <div className="text-3xl font-black tracking-[0.2em] text-zinc-900 dark:text-white">
              {roomCode}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyCode}
            className="h-auto"
          >
            <IconCopy className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Players ({players.length})
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players.map((player) => (
              <div
                key={player.userId}
                className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={player.userImage || ""} />
                  <AvatarFallback>{player.userName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900 dark:text-white">
                    {player.userName}
                  </div>
                </div>
                {player.userId === players[0]?.userId && (
                  <Badge className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    HOST
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {isHost && (
          <Button
            onClick={handleStartGame}
            disabled={startGameMutation.isPending || players.length < 2}
            className="w-full"
            size="lg"
          >
            {startGameMutation.isPending && <Loader />}
            {players.length < 2 ? "Need 2+ players" : "Start Game"}
            <IconPlayerPlay className="ml-2 h-4 w-4" />
          </Button>
        )}

        {!isHost && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-center text-sm text-blue-700 dark:text-blue-300">
            Waiting for host to start the game...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
