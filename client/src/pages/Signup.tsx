import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      navigate("/dashboard");
    } catch {
      setError("Registration failed");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-black text-black dark:text-white">
      {/* LEFT – Branding / Content */}
      <div className="hidden lg:flex flex-col justify-center px-16 border-r border-neutral-200 dark:border-neutral-800">
        <h1 className="text-4xl font-bold tracking-tight">AttendEasy</h1>

        <p className="mt-6 text-neutral-600 dark:text-neutral-400 max-w-md">
          Create your AttendEasy account and start managing attendance with
          secure QR sessions and role-based dashboards.
        </p>

        <ul className="mt-8 space-y-3 text-sm">
          <li>✅ Secure QR attendance</li>
          <li>✅ Multi-role system (Student, Teacher, CR)</li>
          <li>✅ Real-time validation</li>
          <li>✅ Smart analytics & reports</li>
        </ul>

        <p className="mt-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} AttendEasy
        </p>
      </div>

      {/* RIGHT – Signup Form */}
      <div className="flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold mb-2">Create your account</h2>

          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Join AttendEasy in less than a minute
          </p>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <input
            placeholder="Full name"
            className="w-full mb-3 p-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email address"
            className="w-full mb-3 p-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 p-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <select
            className="w-full mb-4 p-3 border border-neutral-300 dark:border-neutral-700 rounded bg-transparent"
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="cr">CR</option>
          </select>

          <button className="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded font-medium">
            Sign up
          </button>

          <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-black dark:text-white underline"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
