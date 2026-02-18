import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import Signup from "../pages/Signup";
import { AuthProvider } from "../context/AuthContext";
import Login from "../pages/Login";

export default function AppRoutes(): JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
          {/* Auth */}
          {/* <Route path="/login" element={<Login />} /> */}

          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
