import type { Metadata } from "next";

import { Poppins } from "next/font/google";

import "../index.css";
import Header from "@/components/shared/header";
import Providers from "@/components/providers";
import Footer from "@/components/shared/footer";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "OpenWord",
  description: "OpenWord",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.className} antialiased`}>
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-auto bg-linear-to-tr from-green-500/15 to-orange-500/10 via-neutral-200 dark:via-neutral-800">
            <Header />
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
