import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullPageLoader from "./common/FullPageLoader";

// `allowedRoles` is an optional list such as ["teacher", "admin"]. Leave it
// out and the page only needs a signed-in user, whatever their role.
export default function ProtectedRoute({ children, allowedRoles }) {
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
