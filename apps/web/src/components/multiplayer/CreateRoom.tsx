import { LANGUAGES } from "@/config";
import type { Difficulty } from "@/types";
import { Label } from "@/components/ui/label";
import Loader from "@/components/shared/loader";
import { Button } from "@/components/ui/button";
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  Select,
} from "@/components/ui/select";

function CreateRoom({
  difficulty,
  setDifficulty,
  language,
  setLanguage,
  onCreate,
  isCreating,
  numRounds = 3,
  setNumRounds,
}: {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  language: string;
  setLanguage: (l: string) => void;
  onCreate: () => void;
  isCreating: boolean;
  numRounds?: number;
  setNumRounds?: (r: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as Difficulty)}
        >
          <SelectTrigger id="difficulty" className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="extreme">Extreme</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Language Selection */}
      <div>
        <Label htmlFor="language">Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger id="language" className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Rounds Selection */}
      <div>
        <Label htmlFor="rounds">Number of Rounds</Label>
        <Select
          value={numRounds?.toString() || "3"}
          onValueChange={(v) => setNumRounds?.(parseInt(v))}
        >
          <SelectTrigger id="rounds" className="w-full mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {[1, 3, 5, 7, 10].map((n) => (
                <SelectItem key={n} value={n.toString()}>
                  {n} Round{n !== 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={onCreate}
        disabled={isCreating}
        className="w-full"
        size="lg"
      >
        {isCreating && <Loader />}
        Create Room
      </Button>
    </div>
  );
}

export default CreateRoom;
