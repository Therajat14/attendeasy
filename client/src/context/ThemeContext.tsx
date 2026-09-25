import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_KEY = "attendeasy.theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(THEME_KEY, theme);

    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      return;
    }

    document.documentElement.classList.remove("dark");
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        setTheme: setThemeState,
        toggleTheme: () =>
          setThemeState((current) => (current === "dark" ? "light" : "dark")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
