import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./common/FullPageLoader";

// Sends each signed-in user to the dashboard that matches their role.
export default function RoleRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader label="Opening your workspace" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "teacher" || user.role === "admin") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (user.role === "student" || user.role === "cr") {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}
