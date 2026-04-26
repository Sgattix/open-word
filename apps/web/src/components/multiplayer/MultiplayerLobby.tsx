import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Difficulty } from "@/types";
import { DIFFICULTY_PRESETS, LANGUAGES } from "@/config";
import { trpc, queryClient } from "@/utils/trpc";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import JoinRoom from "./JoinRoom";
import CreateRoom from "./CreateRoom";

export function MultiplayerLobby() {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [joinCode, setJoinCode] = useState("");
  const [language, setLanguage] = useState("en");
  const [numRounds, setNumRounds] = useState(3);
  const [timePerRound, setTimePerRound] = useState(60);

  const { setRoomId, setRoomCode } = useMultiplayer();

  const createRoomMutation = useMutation({
    mutationFn: (input: {
      difficulty: string;
      wordLength: number;
      language: string;
      numRounds: number;
      timePerRound: number;
    }) => trpc.multiplayer.createRoom.mutate(input),
    onSuccess: (data: any) => {
      setRoomId(data.roomId);
      setRoomCode(data.code);
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: (input: { code: string }) =>
      trpc.multiplayer.joinRoom.mutate(input),
    onSuccess: (data: any) => {
      setRoomId(data.roomId);
      void queryClient.invalidateQueries({
        queryKey: ["multiplayer", "getRoomState"],
      });
    },
  });

  function handleCreateRoom() {
    const settings =
      DIFFICULTY_PRESETS[difficulty as keyof typeof DIFFICULTY_PRESETS];
    if (!settings) return;
    createRoomMutation.mutate({
      difficulty,
      wordLength: settings.wordLength,
      language,
      numRounds,
      timePerRound,
    });
  }

  function handleJoinRoom() {
    if (!joinCode.trim()) return;
    joinRoomMutation.mutate({ code: joinCode.toUpperCase() });
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-3 text-center pt-8 pb-6">
        <CardTitle className="text-4xl font-black tracking-[0.18em] uppercase text-zinc-900 dark:text-white">
          Multiplayer
        </CardTitle>
        <CardDescription className="text-base text-zinc-600 dark:text-zinc-400">
          Race against other players in real-time
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button
            variant={mode === "create" ? "default" : "outline"}
            onClick={() => setMode("create")}
            className="flex-1"
          >
            Create Room
          </Button>
          <Button
            variant={mode === "join" ? "default" : "outline"}
            onClick={() => setMode("join")}
            className="flex-1"
          >
            Join Room
          </Button>
        </div>

        {mode === "create" ? (
          <CreateRoom
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            language={language}
            setLanguage={setLanguage}
            numRounds={numRounds}
            setNumRounds={setNumRounds}
            timePerRound={timePerRound}
            setTimePerRound={setTimePerRound}
            onCreate={handleCreateRoom}
            isCreating={createRoomMutation.isPending}
          />
        ) : (
          <JoinRoom
            onJoin={handleJoinRoom}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
          />
        )}
      </CardContent>
    </Card>
  );
}
