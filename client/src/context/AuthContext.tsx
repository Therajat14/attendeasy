import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";
import type { User } from "../types/user";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: User["role"];
  rollNo?: number;
  course?: string;
  class?: string;
  section?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When the app opens we ask the backend "who am I?".
  // If the cookie is still valid the backend sends the user back.
  useEffect(() => {
    const checkIfLoggedIn = async () => {
      try {
        const response = await api.get<User>("/auth/me");
        setUser(response.data);
      } catch {
        // No valid cookie, so nobody is signed in.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkIfLoggedIn();
  }, []);

  const login = async (input: LoginInput) => {
    try {
      const response = await api.post<{ user: User }>("/auth/login", input);
      setUser(response.data.user);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't sign you in."));
    }
  };

  const register = async (input: RegisterInput) => {
    try {
      const response = await api.post<{ user: User }>("/auth/register", input);
      setUser(response.data.user);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't create your account."));
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Even if the server call fails we still sign the user out locally.
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
