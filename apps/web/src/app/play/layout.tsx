import { GameContextProvider } from "@/context/GameContex";

export const metadata = {
  title: "Play - OpenWord",
};

function PlayLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <GameContextProvider>{children}</GameContextProvider>;
}

export default PlayLayout;
