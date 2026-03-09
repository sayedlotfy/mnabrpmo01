import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(v => !v) };
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className={`relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300 ${
        isDark
          ? "bg-white/10 hover:bg-white/20 text-amber-300"
          : "bg-black/5 hover:bg-black/10 text-slate-600"
      } ${className}`}
      title={isDark ? "الوضع الفاتح" : "الوضع الداكن"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
          }`}
        />
        <Moon
          className={`absolute inset-0 w-4 h-4 transition-all duration-300 ${
            isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          }`}
        />
      </div>
    </button>
  );
}
