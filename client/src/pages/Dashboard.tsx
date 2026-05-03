import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface AttendanceStudent {
  studentId: string;
  name: string;
  email: string;
  rollNo: number | null;
  submittedAt: string;
}

interface AttendanceSession {
  id: string;
  lectureName: string;
  class: string;
  section: string;
  date: string;
  formUrl: string;
  expiresAt: string;
  isActive: boolean;
  students: AttendanceStudent[];
  studentCount: number;
}

interface StartAttendanceResponse {
  formUrl: string;
  expiresAt: string;
  session: AttendanceSession;
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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState({
    lectureName: "",
    class: "",
    section: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [now, setNow] = useState(Date.now());

  const fetchSessions = async (showLoading = true) => {
    if (user?.role !== "teacher") return;

    if (showLoading) {
      setLoadingSessions(true);
    }
    setError("");

    try {
      const response = await api.get<AttendanceSession[]>("/attendance");
      setSessions(response.data);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      if (showLoading) {
        setLoadingSessions(false);
      }
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user?.role]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (user?.role !== "teacher") return;

    const intervalId = window.setInterval(() => {
      fetchSessions(false);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [user?.role]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.isActive && new Date(session.expiresAt).getTime() > now),
    [sessions, now],
  );

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) || activeSession || sessions[0],
    [activeSession, selectedSessionId, sessions],
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleStartSession = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setStartingSession(true);

    try {
      const response = await api.post<StartAttendanceResponse>("/attendance/start", sessionForm);
      setSessions((prev) => [response.data.session, ...prev]);
      setSelectedSessionId(response.data.session.id);
      setSessionForm({ lectureName: "", class: "", section: "" });
      setSuccess("Attendance session started. Share the form link with students.");
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setStartingSession(false);
    }
  };

  const handleCopyFormLink = async (formUrl: string) => {
    await navigator.clipboard.writeText(formUrl);
    setSuccess("Form link copied.");
  };

  const handleEndSession = async (sessionId: string) => {
    setError("");
    setSuccess("");
    setEndingSession(true);

    try {
      const response = await api.patch<{ session: AttendanceSession }>(`/attendance/${sessionId}/end`);
      setSessions((prev) =>
        prev.map((session) => (session.id === sessionId ? response.data.session : session)),
      );
      setSuccess("Attendance session ended.");
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setEndingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <header className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.name} · {user?.role}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
        {user?.role !== "teacher" ? (
          <section className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
            <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">Attendance management is currently available for teachers.</p>
          </section>
        ) : (
          <div className="space-y-6">
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

            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-2xl font-bold">Start attendance</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Create one 30-minute live session for a lecture. Only one active session is allowed at a time.
              </p>

              <form onSubmit={handleStartSession} className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_0.8fr_auto]">
                <input
                  required
                  value={sessionForm.lectureName}
                  onChange={(e) => setSessionForm({ ...sessionForm, lectureName: e.target.value })}
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                  placeholder="Lecture name"
                />
                <input
                  required
                  value={sessionForm.class}
                  onChange={(e) => setSessionForm({ ...sessionForm, class: e.target.value })}
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                  placeholder="Class"
                />
                <input
                  required
                  value={sessionForm.section}
                  onChange={(e) => setSessionForm({ ...sessionForm, section: e.target.value })}
                  className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                  placeholder="Section"
                />
                <button
                  type="submit"
                  disabled={startingSession || Boolean(activeSession)}
                  className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
                >
                  {startingSession ? "Starting..." : "Generate link"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-2xl font-bold">Active session</h2>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Live submissions update when you refresh or start/end a session.</p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchSessions()}
                  disabled={loadingSessions}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  {loadingSessions ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {activeSession ? (
                <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row">
                    <div>
                      <h3 className="text-xl font-semibold">{activeSession.lectureName}</h3>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {activeSession.class} · Section {activeSession.section}
                      </p>
                      <p className="mt-3 text-sm font-medium">Time remaining: {formatCountdown(activeSession.expiresAt)}</p>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Students submitted: {activeSession.studentCount}
                      </p>
                    </div>
                    <div className="space-y-3 lg:min-w-80">
                      <p className="break-all rounded-xl border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-black">
                        {activeSession.formUrl}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleCopyFormLink(activeSession.formUrl)}
                          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEndSession(activeSession.id)}
                          disabled={endingSession}
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                        >
                          {endingSession ? "Ending..." : "End session"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-5 rounded-xl border border-dashed border-neutral-300 p-5 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                  No live attendance session right now.
                </p>
              )}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
                <h2 className="text-2xl font-bold">Past attendance</h2>
                <div className="mt-5 space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">No attendance sessions yet.</p>
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`block w-full rounded-xl border p-4 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-950 ${
                          selectedSession?.id === session.id
                            ? "border-black dark:border-white"
                            : "border-neutral-200 dark:border-neutral-800"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold">{session.lectureName}</h3>
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                              {new Date(session.date).toLocaleDateString()} · {session.class}/{session.section}
                            </p>
                          </div>
                          <span className="rounded-full border border-neutral-300 px-2.5 py-1 text-xs dark:border-neutral-700">
                            {session.studentCount} students
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
                <h2 className="text-2xl font-bold">Session students</h2>
                {selectedSession ? (
                  <div className="mt-5">
                    <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-950">
                      <h3 className="font-semibold">{selectedSession.lectureName}</h3>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        {selectedSession.class} · Section {selectedSession.section} · {new Date(selectedSession.date).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                      {selectedSession.students.length === 0 ? (
                        <p className="p-4 text-sm text-neutral-600 dark:text-neutral-400">No students submitted yet.</p>
                      ) : (
                        <table className="w-full text-left text-sm">
                          <thead className="bg-neutral-50 text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400">
                            <tr>
                              <th className="px-4 py-3 font-medium">Roll No</th>
                              <th className="px-4 py-3 font-medium">Name</th>
                              <th className="px-4 py-3 font-medium">Email</th>
                              <th className="px-4 py-3 font-medium">Submitted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedSession.students.map((student) => (
                              <tr key={`${selectedSession.id}-${student.studentId}`} className="border-t border-neutral-200 dark:border-neutral-800">
                                <td className="px-4 py-3">{student.rollNo ?? "N/A"}</td>
                                <td className="px-4 py-3">{student.name}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{student.email || "Not available"}</td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                  {new Date(student.submittedAt).toLocaleTimeString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400">Select a session to view students.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
