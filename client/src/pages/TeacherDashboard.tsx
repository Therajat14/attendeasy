import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  CalendarPlus,
  Check,
  ClipboardCopy,
  Clock3,
  Play,
  Radio,
  Square,
  Users,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/common/PageHeader";
import AttendanceQRCode from "../components/attendance/AttendanceQRCode";
import QRPresentation from "../components/attendance/QRPresentation";
import Alert from "../components/ui/Alert";
import Avatar from "../components/ui/Avatar";
import Badge, { LiveBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, StatCard } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { SelectField, TextField } from "../components/ui/Field";
import { SkeletonRow } from "../components/ui/Skeleton";
import { useSessions } from "../hooks/useSessions";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";
import { formatTime, getRemainingTime, getShortName, toTitleCase } from "../lib/format";
import { CLASSES, COURSES, SECTIONS } from "../lib/constants";
import type { AttendanceSession, StartSessionResponse } from "../types/attendance";

const emptyForm = { lectureName: "", course: "", class: "", section: "" };

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const isTeacher = user?.role === "teacher";

  const {
    sessions,
    setSessions,
    loading,
    refreshing,
    error,
    setError,
    refresh,
    refreshSilently,
  } = useSessions(isTeacher);

  const [now, setNow] = useState(Date.now());
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof typeof emptyForm, string>>
  >({});
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // The one session that is open right now.
  const activeSession = sessions.find(
    (session) => session.isActive && new Date(session.expiresAt).getTime() > now,
  );

  // The four newest finished sessions, shown under the live card.
  const recentSessions = sessions
    .filter((session) => session.id !== activeSession?.id)
    .slice(0, 4);

  // Three small numbers for the cards at the top of the page.
  const totalSessions = sessions.length;
  const totalMarks = sessions.reduce((sum, session) => sum + session.studentCount, 0);
  const todaySessions = sessions.filter(
    (session) => new Date(session.date).toDateString() === new Date(now).toDateString(),
  ).length;
  const average = totalSessions ? Math.round(totalMarks / totalSessions) : 0;

  const remaining = activeSession
    ? getRemainingTime(activeSession.expiresAt, now)
    : null;

  const handleStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const nextErrors: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (form.lectureName.trim().length < 2)
      nextErrors.lectureName = "Enter the subject or lecture name.";
    if (!form.course) nextErrors.course = "Select a course.";
    if (!form.class) nextErrors.class = "Select a year.";
    if (!form.section) nextErrors.section = "Select a section.";

    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStarting(true);

    try {
      const response = await api.post<StartSessionResponse>("/attendance/start", {
        ...form,
        lectureName: form.lectureName.trim(),
      });

      setSessions((current) => [response.data.session, ...current]);
      setForm(emptyForm);
      setFormErrors({});

      notify({
        title: "Session is live",
        description: "Share the code so your class can mark attendance.",
        tone: "success",
      });
    } catch (err) {
      const message = getErrorMessage(err, "We couldn't start the session.");

      if (message.toLowerCase().includes("already have a live")) {
        notify({
          title: "A session is already running",
          description: message,
          tone: "error",
        });
        void refreshSilently();
      } else {
        setError(message);
      }
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = async (sessionId: string) => {
    setEnding(true);

    try {
      const response = await api.patch<{ session: AttendanceSession }>(
        `/attendance/${sessionId}/end`,
      );
      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId ? response.data.session : session,
        ),
      );

      notify({
        title: "Session closed",
        description: "The attendance link is no longer active.",
        tone: "info",
      });
    } catch (err) {
      notify({
        title: "Couldn't close the session",
        description: getErrorMessage(err),
        tone: "error",
      });
    } finally {
      setEnding(false);
    }
  };

  const handleCopy = async (formUrl: string) => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
      notify({
        title: "Link copied",
        description: "Paste it anywhere to share.",
        tone: "success",
      });
    } catch {
      notify({
        title: "Couldn't copy the link",
        description: "Select the link and copy it manually.",
        tone: "error",
      });
    }
  };

  if (!isTeacher) {
    return (
      <DashboardLayout contextLabel="Overview">
        <PageHeader
          eyebrow="Teacher workspace"
          title="Attendance sessions"
          description="Sessions are managed by teaching staff. If you have access, sign in with your teacher account."
        />
        <EmptyState
          icon={<Users className="size-6" />}
          title="You don't have teacher access"
          description="This workspace is limited to teaching staff accounts."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout contextLabel="Overview">
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${getShortName(user?.name)}`}
        description="Start a lecture session, share the code, and watch your class mark in real time."
        actions={
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            loadingLabel="Refreshing"
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert
          tone="danger"
          icon={<AlertCircle className="size-4" />}
          className="mb-6"
          onDismiss={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Session status"
          value={activeSession ? "Live now" : "Idle"}
          hint={
            activeSession
              ? `${activeSession.lectureName} is open`
              : "No session is running"
          }
          icon={<Radio className="size-4" />}
          tone={activeSession ? "success" : "default"}
        />
        <StatCard
          label="Sessions today"
          value={todaySessions}
          hint={`${totalSessions} in total`}
          icon={<CalendarPlus className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Average per session"
          value={average}
          hint="Students marked per lecture"
          icon={<Users className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Card>
          <CardHeader
            title="Start a session"
            description="Attendance stays open for 30 minutes, or until you close it."
            icon={<Play className="size-4" />}
          />

          <form onSubmit={handleStart} className="mt-5 space-y-4" noValidate>
            <TextField
              label="Subject or lecture"
              placeholder="e.g. Data Structures"
              value={form.lectureName}
              error={formErrors.lectureName}
              onChange={(event) =>
                setForm({ ...form, lectureName: event.target.value })
              }
              disabled={Boolean(activeSession)}
            />

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Course"
                placeholder="Select"
                options={COURSES.map((course) => ({
                  value: course,
                  label: course,
                }))}
                value={form.course}
                error={formErrors.course}
                onChange={(event) => setForm({ ...form, course: event.target.value })}
                disabled={Boolean(activeSession)}
              />
              <SelectField
                label="Year"
                placeholder="Select"
                options={CLASSES.map((year) => ({
                  value: year,
                  label: year.replace(/st|nd|rd|th/g, ""),
                }))}
                value={form.class}
                error={formErrors.class}
                onChange={(event) => setForm({ ...form, class: event.target.value })}
                disabled={Boolean(activeSession)}
              />
            </div>

            <SelectField
              label="Section"
              placeholder="Select"
              options={SECTIONS.map((section) => ({
                value: section,
                label: `Section ${section}`,
              }))}
              value={form.section}
              error={formErrors.section}
              onChange={(event) => setForm({ ...form, section: event.target.value })}
              disabled={Boolean(activeSession)}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={starting}
              loadingLabel="Opening session"
              disabled={Boolean(activeSession)}
              leadingIcon={!starting ? <Play className="size-4" /> : undefined}
            >
              {activeSession ? "Session already running" : "Open attendance"}
            </Button>
          </form>
        </Card>

        <div className="min-w-0 space-y-6">
          {activeSession && remaining ? (
            <Card className="border-brand-200 dark:border-brand-500/30">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <LiveBadge />
                    <Badge tone="neutral">
                      {toTitleCase(activeSession.lectureName)}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-[19px] font-extrabold text-ink-900 dark:text-white">
                    {activeSession.lectureName}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                    {activeSession.course} · {activeSession.class} · Section{" "}
                    {activeSession.section}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-semibold tracking-wide text-ink-400 uppercase">
                    Time left
                  </p>
                  <p
                    className={`mt-1 font-display text-2xl font-extrabold tabular-nums ${
                      remaining.isUrgent
                        ? "text-red-600 dark:text-red-400"
                        : "text-ink-900 dark:text-white"
                    }`}
                  >
                    {remaining.label}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-[auto_1fr]">
                <AttendanceQRCode
                  value={activeSession.formUrl}
                  label="Scan to mark attendance"
                  caption={`Opens for ${activeSession.course} · ${activeSectionLabel(activeSession)}`}
                />

                <div className="flex min-w-0 flex-col gap-3">
                  <QRPresentation
                    value={activeSession.formUrl}
                    title={activeSession.lectureName}
                    subtitle={`${activeSession.course} · ${activeSectionLabel(activeSession)}`}
                    timeLeft={remaining?.label}
                    isUrgent={remaining?.isUrgent}
                  />
                  <div className="rounded-2xl bg-ink-50 p-4 dark:bg-ink-800/50">
                    <p className="text-[11.5px] font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
                      Marked present
                    </p>
                    <p className="mt-1.5 font-display text-3xl font-extrabold text-ink-900 dark:text-white">
                      {activeSession.studentCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-ink-200/80 p-4 dark:border-ink-800">
                    <p className="text-[11.5px] font-semibold tracking-wide text-ink-500 uppercase dark:text-ink-400">
                      How students join
                    </p>
                    <p className="mt-1.5 text-[12.5px] text-ink-600 dark:text-ink-300">
                      Share the code on screen, or send the link to your class group.
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleCopy(activeSession.formUrl)}
                      leadingIcon={
                        copied ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <ClipboardCopy className="size-4" />
                        )
                      }
                    >
                      {copied ? "Copied" : "Copy link"}
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      loading={ending}
                      loadingLabel="Closing"
                      onClick={() => void handleEnd(activeSession.id)}
                      leadingIcon={
                        !ending ? <Square className="size-3.5" /> : undefined
                      }
                    >
                      Close session
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-ink-200/80 pt-4 dark:border-ink-800">
                <p className="mb-3 text-[12px] font-semibold text-ink-500 dark:text-ink-400">
                  Marking now
                </p>

                {activeSession.students.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-ink-200 px-4 py-5 text-center text-[12.5px] text-ink-500 dark:border-ink-700 dark:text-ink-400">
                    Nobody has marked attendance yet. Share the code to get started.
                  </p>
                ) : (
                  <ul className="scrollbar-slim -mx-1 max-h-64 space-y-1.5 overflow-y-auto px-1">
                    {activeSession.students.map((student) => (
                      <li
                        key={`${activeSession.id}-${student.studentId}`}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-ink-50 dark:hover:bg-ink-800/50"
                      >
                        <Avatar name={student.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">
                            {student.name}
                          </p>
                          <p className="text-[11.5px] text-ink-500 dark:text-ink-400">
                            Roll {student.rollNo ?? "—"}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="size-3.5" />
                          {formatTime(student.submittedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <CardHeader
                title="No session running"
                description="Open a session and share the code to start taking attendance."
                icon={<Clock3 className="size-4" />}
              />
              <div className="mt-5">
                <EmptyState
                  compact
                  icon={<Radio className="size-5" />}
                  title="You're all clear"
                  description="Start a session from the panel and your class code will appear here."
                />
              </div>
            </Card>
          )}

          <Card>
            <CardHeader
              title="Recent sessions"
              description="Your latest lectures and how many students attended."
              icon={<CalendarPlus className="size-4" />}
            />

            <div className="mt-5">
              {loading ? (
                <div className="overflow-hidden rounded-xl border border-ink-200/80 dark:border-ink-800">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : recentSessions.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-[12.5px] text-ink-500 dark:border-ink-700 dark:text-ink-400">
                  Your previous sessions will appear here.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {recentSessions.map((session) => (
                    <li
                      key={session.id}
                      className="flex items-center gap-3 rounded-xl border border-ink-200/80 px-3.5 py-3 dark:border-ink-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-ink-900 dark:text-white">
                          {session.lectureName}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-ink-500 dark:text-ink-400">
                          {session.course} · {session.class} · Section {session.section}{" "}
                          · {formatTime(session.date)}
                        </p>
                      </div>
                      <Badge tone={session.isActive ? "success" : "neutral"}>
                        {session.studentCount} present
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function activeSectionLabel(session: { class: string; section: string }): string {
  return `${session.class} · Section ${session.section}`;
}
