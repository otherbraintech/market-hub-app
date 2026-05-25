"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Zap, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface LandingHeaderProps {
  hasSession: boolean;
}

export function LandingHeader({ hasSession }: LandingHeaderProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-350 border-b border-gray-200/10 dark:border-gray-800/10 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <Zap className="size-5" />
          </div>
          <span className="truncate font-black text-lg tracking-tight text-gray-900 dark:text-white">
            Market<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Hub</span>
          </span>
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
            >
              <div className="relative flex items-center justify-center">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </div>
            </Button>
          )}

          {/* Nav Action */}
          {hasSession ? (
            <Button asChild size="sm" className="hidden sm:flex h-9 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-500/10">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-1.5 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="hidden sm:flex h-9 rounded-xl font-bold border-gray-200 dark:border-slate-800 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <Link href="/login">
                <LogIn className="mr-1.5 h-4 w-4" />
                Ingresar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
