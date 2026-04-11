import { MultiplayerProvider } from "@/context/MultiplayerContext";

export const metadata = {
  title: "Multiplayer - OpenWord",
};

export default function MultiplayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MultiplayerProvider>{children}</MultiplayerProvider>;
}
