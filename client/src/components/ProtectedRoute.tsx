import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./common/FullPageLoader";
import type { User } from "../types/user";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: User["role"][];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader label="Checking your access" />;
  }

  // No user means the cookie is missing or expired, so send them to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Signed in, but this page belongs to a different role.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
