import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AxiosError } from "axios";
import { api, getStoredToken, setAuthToken, setStoredToken } from "../services/api";
import type { User } from "../types/user";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: User["role"];
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<void>;
  register: (details: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(raw: Partial<User> & { _id?: string; id?: string }): User {
  return {
    id: raw.id || raw._id || "",
    _id: raw._id,
    name: raw.name || "",
    email: raw.email || "",
    role: (raw.role as User["role"]) || "student",
  };
}

function extractApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "Something went wrong";
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    setAuthToken(token);

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<User>("/auth/me")
      .then((response) => {
        setUser(normalizeUser(response.data));
      })
      .catch(() => {
        setStoredToken(null);
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status === 401) {
          setStoredToken(null);
          setAuthToken(null);
          setUser(null);
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (credentials: LoginPayload) => {
    try {
      const response = await api.post<AuthResponse>("/auth/login", credentials);
      const token = response.data.token;
      const nextUser = normalizeUser(response.data.user);

      setStoredToken(token);
      setAuthToken(token);
      setUser(nextUser);
    } catch (error) {
      throw new Error(extractApiError(error));
    }
  };

  const register = async (details: RegisterPayload) => {
    try {
      const response = await api.post<AuthResponse>("/auth/register", details);
      const token = response.data.token;
      const nextUser = normalizeUser(response.data.user);

      setStoredToken(token);
      setAuthToken(token);
      setUser(nextUser);
    } catch (error) {
      throw new Error(extractApiError(error));
    }
  };

  const logout = () => {
    setStoredToken(null);
    setAuthToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
