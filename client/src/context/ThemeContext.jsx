import { createContext, useContext, useEffect, useState } from "react";

// The theme is remembered in the browser's localStorage under this key, so it
// survives a page reload.
const THEME_KEY = "attendeasy.theme";

// What any page can read from useTheme():
// { theme, isDark, setTheme, toggleTheme }
const ThemeContext = createContext(undefined);

// Works out which theme to start with, before React has rendered anything.
//
// The order we try is:
//   1. what the user picked last time, if we remember it
//   2. what their operating system is set to
//   3. light, as a last resort
function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const rememberedTheme = window.localStorage.getItem(THEME_KEY);

  if (rememberedTheme === "light" || rememberedTheme === "dark") {
    return rememberedTheme;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (prefersDark) {
    return "dark";
  }

  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Every time the theme changes, remember it and update the page background.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_KEY, theme);

    // The "dark" class on <html> is what Tailwind uses to switch colours.
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Flips between "light" and "dark".
  function toggleTheme() {
    setThemeState((currentTheme) => {
      if (currentTheme === "dark") {
        return "light";
      }

      return "dark";
    });
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: theme,
        isDark: theme === "dark",
        setTheme: setThemeState,
        toggleTheme: toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
