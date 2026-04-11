"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime } from "@/lib/utils";

interface UserStatsProps {
  stats:
    | {
        totalGames: number;
        wins: number;
        losses: number;
        winRate: number;
        averageScore: number;
        averageGuesses: number;
        averageTime: number;
        bestScore: number;
        difficultyBreakdown: Record<
          string,
          { wins: number; losses: number; avgScore: number }
        >;
      }
    | undefined;
}

export default function UserStats({ stats }: UserStatsProps) {
  if (!stats || stats.totalGames === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            No games played yet. Start your first game to see statistics!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                Total Games
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {stats.totalGames}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                Wins
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {stats.wins}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {stats.winRate.toFixed(1)}% win rate
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                Losses
              </div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                {stats.losses}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                Best Score
              </div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                {stats.bestScore}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                Avg Score
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
                {stats.averageScore}
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                Avg Guesses
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
                {stats.averageGuesses.toFixed(1)}
              </div>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 uppercase font-semibold">
                Avg Time
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
                {formatTime(stats.averageTime)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Breakdown */}
      {Object.keys(stats.difficultyBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.difficultyBreakdown).map(
                ([difficulty, data]) => (
                  <div
                    key={difficulty}
                    className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="capitalize font-semibold text-zinc-900 dark:text-white">
                        {difficulty}
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {data.wins}W - {data.losses}L
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        Avg Score
                      </div>
                      <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {data.avgScore}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
