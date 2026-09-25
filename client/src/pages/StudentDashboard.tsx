import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  CircleSlash,
  Clock3,
  History,
  Radio,
  Sparkles,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import Badge, { LiveBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, StatCard } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Progress from "../components/ui/Progress";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useStudentAttendance } from "../hooks/useStudentAttendance";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";
import { formatTime, getRemainingTime, getShortName, groupByDate } from "../lib/format";
import type { AttendanceSession } from "../types/attendance";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { notify } = useToast();
  const isStudent = user?.role === "student";

  const { live, history, loading, refreshing, error, setError, refresh } =
    useStudentAttendance(isStudent);
  const [now, setNow] = useState(Date.now());
  const [markingToken, setMarkingToken] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const thisMonthCount = useMemo(() => {
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return history.filter((session) => new Date(session.date) >= monthStart).length;
  }, [history, now]);

  const pending = live.filter((session) => !session.hasMarked);
  const firstName = getShortName(user?.name);

  const markPresent = async (session: AttendanceSession) => {
    setMarkingToken(session.formToken);
    setError("");

    try {
      await api.post(`/attendance/mark/${session.formToken}`);
      notify({
        title: "Attendance recorded",
        description: `You're marked present for ${session.lectureName}.`,
        tone: "success",
      });
    } catch (err) {
      const message = getErrorMessage(err, "We couldn't record your attendance.");

      if (message.toLowerCase().includes("already")) {
        notify({
          title: "Already marked",
          description: "You're on the list for this session.",
          tone: "info",
        });
      } else {
        setError(message);
      }
    } finally {
      setMarkingToken(null);
      await refresh(false);
    }
  };

  if (!isStudent) {
    return (
      <DashboardLayout contextLabel="Overview">
        <PageHeader
          eyebrow="Student workspace"
          title="Your attendance"
          description="Marking attendance is available to student accounts."
        />
        <EmptyState
          icon={<UserCheck className="size-6" />}
          title="You don't have a student account"
          description="Sign in with your student account to mark attendance."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout contextLabel="Overview">
      <PageHeader
        eyebrow="Overview"
        title={`Hi ${firstName}, let's get you marked`}
        description="Lectures that are live right now appear below. One tap is all it takes."
        actions={
          <Button
            variant="secondary"
            size="sm"
            loading={refreshing}
            loadingLabel="Checking"
            onClick={() => void refresh(true)}
          >
            Check again
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
          label="Live lectures"
          value={live.length}
          hint={live.length ? "Mark attendance below" : "Nothing running right now"}
          icon={<Radio className="size-4" />}
          tone={live.length ? "success" : "default"}
        />
        <StatCard
          label="Still to mark"
          value={pending.length}
          hint={pending.length ? "Don't miss these" : "You're all caught up"}
          icon={<BellRing className="size-4" />}
          tone={pending.length ? "warning" : "success"}
        />
        <StatCard
          label="Marked this month"
          value={thisMonthCount}
          icon={<TrendingUp className="size-4" />}
          tone="brand"
        />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Live right now"
            description="Only lectures for your course, year and section show up here."
            icon={<Radio className="size-4" />}
            action={
              live.length > 0 ? (
                <Badge tone="success">{live.length} open</Badge>
              ) : undefined
            }
          />

          <div className="mt-5">
            {loading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : live.length === 0 ? (
              <EmptyState
                icon={<Clock3 className="size-6" />}
                title="No lectures running"
                description="When a teacher opens attendance, it will show up here straight away. Keep this page open or check back before your next class."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {live.map((session) => (
                  <LiveSessionCard
                    key={session.id}
                    session={session}
                    now={now}
                    marking={markingToken === session.formToken}
                    onMark={() => void markPresent(session)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Recently marked"
            description="Your last few lectures you attended."
            icon={<History className="size-4" />}
          />

          <div className="mt-5">
            {history.length === 0 ? (
              <EmptyState
                compact
                icon={<CircleSlash className="size-5" />}
                title="Nothing here yet"
                description="Lectures you mark will build up here so you can keep track."
              />
            ) : (
              <ul className="space-y-2.5">
                {groupByDate(history.slice(0, 6)).map((group) => (
                  <li key={group.key}>
                    <p className="mb-2 text-[11.5px] font-bold tracking-wider text-ink-400 uppercase">
                      {group.label}
                    </p>
                    <ul className="space-y-2">
                      {group.items.map((session) => (
                        <li
                          key={session.id}
                          className="flex items-center gap-3 rounded-xl border border-ink-200/80 px-3.5 py-3 dark:border-ink-800"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                            <CheckCircle2 className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-bold text-ink-900 dark:text-white">
                              {session.lectureName}
                            </p>
                            <p className="mt-0.5 truncate text-[11.5px] text-ink-500 dark:text-ink-400">
                              {session.course} · {session.class} ·{" "}
                              {formatTime(session.date)} ·{" "}
                              {session.teacher?.name ?? "Faculty"}
                            </p>
                          </div>
                          <Badge tone="success">Present</Badge>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

interface LiveSessionCardProps {
  session: AttendanceSession;
  now: number;
  marking: boolean;
  onMark: () => void;
}

function LiveSessionCard({ session, now, marking, onMark }: LiveSessionCardProps) {
  const remaining = getRemainingTime(session.expiresAt, now);
  const hasMarked = Boolean(session.hasMarked);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 transition ${
        hasMarked
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5"
          : "border-brand-200 bg-white shadow-elevated dark:border-brand-500/30 dark:bg-ink-900/70"
      }`}
    >
      {!hasMarked && (
        <span className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-brand-500/10 blur-2xl" />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {hasMarked ? (
              <Badge tone="success" icon={<CheckCircle2 className="size-3" />}>
                Marked
              </Badge>
            ) : (
              <LiveBadge label="Needs marking" />
            )}
            <span className="text-[11.5px] font-semibold text-ink-500 dark:text-ink-400">
              {session.course} · {session.class} · {session.section}
            </span>
          </div>

          <h3 className="mt-3 text-[18px] leading-tight font-extrabold text-ink-900 dark:text-white">
            {session.lectureName}
          </h3>
          <p className="mt-1 text-[12.5px] text-ink-500 dark:text-ink-400">
            {session.teacher?.name ?? "Your teacher"} · {formatTime(session.date)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[10.5px] font-bold tracking-wider text-ink-400 uppercase">
            Closes in
          </p>
          <p
            className={`mt-0.5 font-display text-xl font-extrabold tabular-nums ${
              remaining.isUrgent
                ? "text-red-600 dark:text-red-400"
                : "text-ink-900 dark:text-white"
            }`}
          >
            {remaining.label}
          </p>
        </div>
      </div>

      <div className="relative mt-4">
        <Progress
          value={(remaining.totalMs / (30 * 60 * 1000)) * 100}
          tone={remaining.isUrgent ? "danger" : "brand"}
        />
        <p className="mt-2 text-[11.5px] text-ink-500 dark:text-ink-400">
          {session.studentCount}{" "}
          {session.studentCount === 1 ? "student has" : "students have"} already marked
        </p>
      </div>

      <Button
        fullWidth
        size="lg"
        className="relative mt-4"
        variant={hasMarked ? "secondary" : "primary"}
        loading={marking}
        loadingLabel="Recording"
        disabled={hasMarked}
        onClick={onMark}
        leadingIcon={
          !marking && !hasMarked ? <Sparkles className="size-4" /> : undefined
        }
      >
        {hasMarked ? "You're on the list" : "Mark me present"}
      </Button>
    </article>
  );
}
