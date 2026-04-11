"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, cn } from "@/lib/utils";

interface Game {
  id: string;
  difficulty: string;
  wordLength: number;
  status: string;
  score: number;
  guessesUsed: number;
  hintsUsed: number;
  timeTaken: number;
  createdAt: Date;
}

interface GameHistoryProps {
  history:
    | {
        games: Game[];
        total: number;
        hasMore: boolean;
      }
    | undefined;
}

export default function GameHistory({ history }: GameHistoryProps) {
  if (!history || history.games.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            No game history yet. Play a game to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Games</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      game.status === "won" ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-white capitalize">
                      {game.status === "won" ? "Won" : "Lost"} •{" "}
                      {game.difficulty}
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      {new Date(game.createdAt).toLocaleDateString()} at{" "}
                      {new Date(game.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 text-right">
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase">
                    Score
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white">
                    {game.score}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase">
                    Guesses
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white">
                    {game.guessesUsed}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 uppercase">
                    Time
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-white">
                    {formatTime(game.timeTaken)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {history.hasMore && (
          <div className="mt-4 text-center">
            <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
              Load more games
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
