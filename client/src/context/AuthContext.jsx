import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";

// What the login and signup forms send to the backend.
// login:    { email, password }
// register: { name, email, password, role, rollNo, course, class, section }
const AuthContext = createContext(undefined);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // When the app opens we ask the backend "who am I?".
  // If the cookie is still valid the backend sends the user back.
  useEffect(() => {
    const checkIfLoggedIn = async () => {
      try {
        const response = await api.get("/auth/me");
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

  const login = async (input) => {
    try {
      const response = await api.post("/auth/login", input);
      setUser(response.data.user);
    } catch (error) {
      throw new Error(getErrorMessage(error, "We couldn't sign you in."));
    }
  };

  const register = async (input) => {
    try {
      const response = await api.post("/auth/register", input);
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
