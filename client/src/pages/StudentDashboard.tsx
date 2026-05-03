import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface AttendanceTeacher {
  id: string;
  name: string;
  email: string;
}

interface AttendanceSession {
  id: string;
  teacher?: AttendanceTeacher;
  lectureName: string;
  course: string;
  class: string;
  section: string;
  date: string;
  formToken: string;
  expiresAt: string;
  isActive: boolean;
  studentCount: number;
  hasMarked?: boolean;
}

function extractApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "Something went wrong";
}

function formatCountdown(expiresAt: string): string {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Expired";

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [liveSessions, setLiveSessions] = useState<AttendanceSession[]>([]);
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingToken, setMarkingToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [now, setNow] = useState(Date.now());

  const fetchStudentAttendance = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError("");

    try {
      const [liveResponse, historyResponse] = await Promise.all([
        api.get<AttendanceSession[]>("/attendance/live"),
        api.get<AttendanceSession[]>("/attendance/student/history"),
      ]);
      setLiveSessions(liveResponse.data);
      setHistory(historyResponse.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchStudentAttendance();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      fetchStudentAttendance(false);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, []);

  const activeSessions = useMemo(
    () => liveSessions.filter((session) => new Date(session.expiresAt).getTime() > now),
    [liveSessions, now],
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleMarkPresent = async (session: AttendanceSession) => {
    setError("");
    setSuccess("");
    setMarkingToken(session.formToken);

    try {
      await api.post(`/attendance/mark/${session.formToken}`);
      setSuccess(`Marked present for ${session.lectureName}.`);
      await fetchStudentAttendance(false);
    } catch (err) {
      const message = extractApiError(err);
      if (message.toLowerCase().includes("already")) {
        setSuccess(`Already marked for ${session.lectureName}.`);
        await fetchStudentAttendance(false);
        return;
      }
      setError(message);
    } finally {
      setMarkingToken(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <header className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Student Dashboard</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {user?.name} · Roll No {user?.rollNo ?? "N/A"}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {user?.course || "Course N/A"} · {user?.class || "Class N/A"} · Section {user?.section || "N/A"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-8">
        {error && (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
            {success}
          </p>
        )}

        <section className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-2xl font-bold">Active attendance</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Mark your presence for currently live lecture sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fetchStudentAttendance()}
              disabled={loading}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {activeSessions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-neutral-300 p-5 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400 lg:col-span-2">
                No active attendance sessions right now.
              </p>
            ) : (
              activeSessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <h3 className="text-xl font-semibold">{session.lectureName}</h3>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {session.course} · {session.class} · Section {session.section}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Teacher: {session.teacher?.name || "Unknown"}
                  </p>
                  <p className="mt-3 text-sm font-medium">Time remaining: {formatCountdown(session.expiresAt)}</p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    Students marked: {session.studentCount}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleMarkPresent(session)}
                    disabled={Boolean(session.hasMarked) || markingToken === session.formToken}
                    className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
                  >
                    {markingToken === session.formToken
                      ? "Marking..."
                      : session.hasMarked
                        ? "Already marked"
                        : "Mark Present"}
                  </button>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
          <h2 className="text-2xl font-bold">Attendance history</h2>
          <div className="mt-5 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">No marked attendance yet.</p>
            ) : (
              history.map((session) => (
                <div key={session.id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-semibold">{session.lectureName}</h3>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {session.course} · {session.class}/{session.section} · {new Date(session.date).toLocaleDateString()}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Teacher: {session.teacher?.name || "Unknown"}
                      </p>
                    </div>
                    <span className="rounded-full border border-green-300 px-2.5 py-1 text-xs text-green-700 dark:border-green-900 dark:text-green-300">
                      Present
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
