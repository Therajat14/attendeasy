import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import ScrollToTop from "../components/common/ScrollToTop";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import StudentForm from "../pages/StudentForm";
import StudentDashboard from "../pages/StudentDashboard";
import StudentHistory from "../pages/StudentHistory";
import TeacherDashboard from "../pages/TeacherDashboard";
import TeacherSessions from "../pages/TeacherSessions";
import NotFound from "../pages/NotFound";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import RoleRedirect from "../components/RoleRedirect";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />

            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <Signup />
                </PublicOnlyRoute>
              }
            />
            <Route path="/form/:token" element={<StudentForm />} />

            <Route path="/dashboard" element={<RoleRedirect />} />

            <Route
              path="/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/sessions"
              element={
                <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                  <TeacherSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student", "cr"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/history"
              element={
                <ProtectedRoute allowedRoles={["student", "cr"]}>
                  <StudentHistory />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
