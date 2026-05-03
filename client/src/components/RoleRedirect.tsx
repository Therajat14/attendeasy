import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "teacher") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (user?.role === "student") {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}
