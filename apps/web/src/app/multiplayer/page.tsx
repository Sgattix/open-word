"use client";
import { Card } from "@/components/ui/card";
import { MultiplayerLobby } from "@/components/multiplayer/MultiplayerLobby";
import { MultiplayerWaitingRoom } from "@/components/multiplayer/MultiplayerWaitingRoom";
import { MultiplayerGameScreen } from "../../components/multiplayer/MultiplayerGameScreen";
import { useMultiplayer } from "@/context/MultiplayerContext";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MultiplayerPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, router, session?.user]);

  if (isPending || !session?.user) {
    return <main className="p-8">Loading multiplayer...</main>;
  }

  const { roomId, gameStarted } = useMultiplayer();

  return (
    <main className="relative mx-auto flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 bg-white dark:bg-zinc-900 transition-all duration-500">
      <Card className="relative w-full max-w-2xl border-0 bg-white dark:bg-zinc-900 shadow-none">
        {!roomId && <MultiplayerLobby />}
        {roomId && !gameStarted && <MultiplayerWaitingRoom />}
        {roomId && gameStarted && <MultiplayerGameScreen />}
      </Card>
    </main>
  );
}
