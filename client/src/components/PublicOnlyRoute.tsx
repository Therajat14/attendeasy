import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./common/FullPageLoader";

// Keeps signed-in users away from the login and signup pages.
export default function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
