import Link from "next/link";
import WordWrapper from "./WordWrapper";

function Hero() {
  return (
    <div className="flex flex-col items-center justify-center h-[90dvh]">
      <WordWrapper
        statuses={[
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
          "correct",
        ]}
        size="lg"
      >
        OPENWORD
      </WordWrapper>
      <p className="text-lg text-neutral-600 dark:text-neutral-400 text-center max-w-lg mt-5">
        The open-source WORDLE clone, free forever.
      </p>
      <div className="flex gap-4 items-center mt-2">
        <Link
          href="/play"
          className="dark:bg-neutral-600 bg-neutral-400 px-4 py-2 text-white"
        >
          Play Now
        </Link>
        <Link href="/login" className="hover:underline">
          Multiplayer
        </Link>
      </div>
    </div>
  );
}

export default Hero;
