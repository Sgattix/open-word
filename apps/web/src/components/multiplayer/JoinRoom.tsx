import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function JoinRoom({
  onJoin,
  joinCode,
  setJoinCode,
}: {
  onJoin: (code: string) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="join-code">Room Code</Label>
        <Input
          id="join-code"
          placeholder="e.g., ABC123"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className="mt-2 uppercase"
          maxLength={6}
        />
      </div>

      <Button
        onClick={onJoin.bind(null, joinCode.trim())}
        disabled={joinCode.trim().length !== 6}
        className="w-full"
        size="lg"
      >
        Join Room
      </Button>
    </div>
  );
}

export default JoinRoom;
