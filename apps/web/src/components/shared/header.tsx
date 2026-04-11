"use client";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/auth/user-menu";
import Image from "next/image";

export default function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark" ? "/logo-sm-dark.png" : "/logo-sm.png";

  const links: Array<{ to: Route; label: string }> = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/multiplayer", label: "Multiplayer" },
  ];

  return (
    <div>
      <div className="flex flex-row items-center justify-between py-5 px-10 bg-transparent">
        <div className="flex flex-row items-center gap-5">
          <Link href="/">
            <div className="relative h-12.5 w-12.5">
              <Image
                src={logoSrc}
                alt="Logo"
                fill
                sizes="50px"
                loading="eager"
                priority
                className="object-contain"
              />
            </div>
          </Link>
          <nav className="flex gap-4 text-md font-medium">
            {links.map(({ to, label }) => {
              return (
                <Link
                  key={to}
                  href={to}
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white transition-colors duration-200"
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
