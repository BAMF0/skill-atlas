import { create } from "zustand";

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  init: () => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  toggle: () =>
    set((s) => {
      const next = !s.isDark;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return { isDark: next };
    }),
  init: () => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", dark);
    set({ isDark: dark });
  },
}));
