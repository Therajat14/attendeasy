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
//   2. light, for everyone else
//
// We deliberately do NOT follow the operating system's dark mode setting. Someone
// whose laptop is in dark mode has not asked AttendEasy to be dark, and a light
// app that simply has a dark switch is less surprising than one that opens in a
// different colour scheme than the site they came from.
function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const rememberedTheme = window.localStorage.getItem(THEME_KEY);

  if (rememberedTheme === "light" || rememberedTheme === "dark") {
    return rememberedTheme;
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

    // The meta tags in index.html follow the operating system, which no longer
    // matches the app once someone picks a theme by hand. Setting this here
    // keeps the browser's own chrome (the address bar on mobile) in step with
    // the page instead of following the OS.
    const themeColor = document.querySelector('meta[name="theme-color"]');

    if (themeColor) {
      themeColor.setAttribute("content", theme === "dark" ? "#0f1219" : "#ffffff");
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
