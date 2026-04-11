"use client";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import GameHistory from "@/components/dashboard/GameHistory";
import UserStats from "@/components/dashboard/UserStats";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const statsQuery = useQuery({
    queryKey: ["userStats"],
    queryFn: () => trpc.userStats.query(),
  });

  const historyQuery = useQuery({
    queryKey: ["gameHistory", 10, 0],
    queryFn: () => trpc.gameHistory.query({ limit: 10, offset: 0 }),
  });

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, router, session?.user]);

  if (isPending || !session?.user) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 p-32">
      <div>
        <h1 className="text-3xl font-bold mb-6">
          Welcome, {session?.user?.name}!
        </h1>

        <div className="mb-8">
          {statsQuery.isLoading ? (
            <div className="animate-pulse">Loading statistics...</div>
          ) : statsQuery.isError ? (
            <div className="text-red-600">Failed to load statistics</div>
          ) : statsQuery.data ? (
            <UserStats stats={statsQuery.data as any} />
          ) : null}
        </div>

        <div>
          {historyQuery.isLoading ? (
            <div className="animate-pulse">Loading game history...</div>
          ) : historyQuery.isError ? (
            <div className="text-red-600">Failed to load game history</div>
          ) : historyQuery.data ? (
            <GameHistory
              history={{
                ...historyQuery.data,
                games: (historyQuery.data.games as any[]).map((game: any) => ({
                  ...game,
                  createdAt: new Date(game.createdAt),
                })),
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
