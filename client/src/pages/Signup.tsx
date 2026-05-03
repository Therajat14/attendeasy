import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rollNo: "",
    course: "",
    class: "",
    section: "",
    role: "student" as "student" | "teacher" | "cr",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role === "student"
          ? {
              rollNo: Number(form.rollNo),
              course: form.course,
              class: form.class,
              section: form.section,
            }
          : {}),
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
            Production-ready Auth
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-4 max-w-md text-sm text-neutral-600 dark:text-neutral-400 sm:text-base">
            Register to access JWT-protected attendance dashboards for your role.
          </p>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
          <h2 className="text-2xl font-semibold">Get started</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Fill in your details below.
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                required
                placeholder="Your full name"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

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
                placeholder="Create a password"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                value={form.role}
                onChange={(e) =>
                  setForm({
                    ...form,
                    role: e.target.value as "student" | "teacher" | "cr",
                  })
                }
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="cr">CR</option>
              </select>
            </div>

            {form.role === "student" && (
              <>
                <div>
                  <label htmlFor="course" className="mb-1 block text-sm font-medium">
                    Course
                  </label>
                  <select
                    id="course"
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                    value={form.course}
                    onChange={(e) => setForm({ ...form, course: e.target.value })}
                  >
                    <option value="">Select course</option>
                    <option value="BCA">BCA</option>
                    <option value="BTech">BTech</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="class" className="mb-1 block text-sm font-medium">
                    Class
                  </label>
                  <select
                    id="class"
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                    value={form.class}
                    onChange={(e) => setForm({ ...form, class: e.target.value })}
                  >
                    <option value="">Select class</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="section" className="mb-1 block text-sm font-medium">
                    Section
                  </label>
                  <select
                    id="section"
                    required
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                  >
                    <option value="">Select section</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="rollNo" className="mb-1 block text-sm font-medium">
                    Roll number
                  </label>
                  <input
                    id="rollNo"
                    type="number"
                    min="1"
                    required
                    placeholder="Enter your roll number"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                    value={form.rollNo}
                    onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
            >
              {submitting ? "Creating account..." : "Create account"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link to="/login" className="font-medium underline">
              Login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
