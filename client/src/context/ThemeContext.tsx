import { createContext, useContext, useState, ReactNode } from "react";

interface ThemeContextType {
  dark: boolean;
  setDark: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [dark, setDark] = useState(false);

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      <div className={dark ? "dark" : ""}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
