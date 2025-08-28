"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-x-2 px-2">
      {resolvedTheme === "dark" ? (
        <Sun
          className="cursor-pointer text-lg text-muted-foreground"
          onClick={() => setTheme("light")}
        />
      ) : (
        <Moon
          className="cursor-pointer text-lg text-muted-foreground"
          onClick={() => setTheme("dark")}
        />
      )}
    </div>
  );
}
