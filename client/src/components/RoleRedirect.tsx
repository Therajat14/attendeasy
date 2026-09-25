import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./common/FullPageLoader";

export default function RoleRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <FullPageLoader label="Opening your workspace" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "teacher" || user?.role === "admin") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (user?.role === "student" || user?.role === "cr") {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}
