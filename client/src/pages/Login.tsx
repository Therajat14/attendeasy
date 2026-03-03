import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <header className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            AttendEasy
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-6xl grid-cols-1 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-12">
        <section className="mb-8 lg:mb-0">
          <p className="inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium dark:border-neutral-700">
            JWT Auth Enabled
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign in securely
          </h1>
          <p className="mt-4 max-w-md text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
            Access your attendance dashboard with secure token-based
            authentication and protected routes.
          </p>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Enter your credentials to continue.
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="you@college.edu"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {submitting ? "Signing in..." : "Login"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
            New here?{" "}
            <Link to="/signup" className="font-medium underline">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
