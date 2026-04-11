import { AvatarImage, AvatarFallback, Avatar } from "../ui/avatar";
import { Card, CardContent } from "../ui/card";
import { useMultiplayerGameLogic } from "../multiplayer/useMultiplayerGameLogic";

function FinalLeaderboard() {
  const { finalRanking, session, revealedCount } = useMultiplayerGameLogic();

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-yellow-400/40 bg-zinc-900 text-white">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-yellow-300">
              Game Over
            </div>
            <div className="text-3xl md:text-4xl font-black tracking-[0.08em] mt-1">
              Final Leaderboard
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {finalRanking.map((player, index) => {
              const revealed = index < revealedCount;
              const isMe = player.userId === session?.user?.id;
              return (
                <div
                  key={player.userId}
                  className={`transition-all duration-500 rounded-lg px-4 py-3 flex items-center gap-3 ${
                    revealed
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  } ${
                    isMe
                      ? "bg-blue-500/20 border border-blue-300/50"
                      : "bg-zinc-800/90 border border-zinc-700"
                  }`}
                  style={{ transitionDelay: `${index * 120}ms` }}
                >
                  <div className="w-8 text-center text-xl font-black text-yellow-300">
                    {index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={player.userImage || ""} />
                    <AvatarFallback>{player.userName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm font-semibold truncate">
                    {player.userName}
                  </div>
                  <div className="text-lg font-black text-green-300">
                    {player.score}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinalLeaderboard;
