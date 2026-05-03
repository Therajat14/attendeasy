import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

function extractApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "Unable to mark attendance";
}

export default function StudentForm() {
  const { token } = useParams();
  const { user, loading, isAuthenticated } = useAuth();
  const [error, setError] = useState("");
  const [marked, setMarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `/form/${token}` }} />;
  }

  const handleMarkPresent = async () => {
    setError("");
    setSubmitting(true);

    try {
      await api.post(`/attendance/mark/${token}`);
      setMarked(true);
    } catch (err) {
      const message = extractApiError(err);
      if (message.toLowerCase().includes("already")) {
        setMarked(true);
        return;
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <header className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            AttendEasy
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-4xl items-center px-4 py-8 sm:px-8">
        <section className="w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
          <p className="inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium dark:border-neutral-700">
            Secure attendance
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Mark your attendance</h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            You are signed in as {user?.name}. Attendance will be marked using your student account.
          </p>

          {user?.role !== "student" && (
            <p className="mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              Only student accounts can mark attendance.
            </p>
          )}

          {error && (
            <p className="mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          {marked && (
            <p className="mt-5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
              Already marked. Your attendance is recorded for this session.
            </p>
          )}

          <button
            type="button"
            onClick={handleMarkPresent}
            disabled={submitting || marked || user?.role !== "student"}
            className="mt-6 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {submitting ? "Marking..." : marked ? "Already marked" : "Mark Present"}
          </button>
        </section>
      </main>
    </div>
  );
}
