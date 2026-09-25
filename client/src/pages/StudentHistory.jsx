import {
  AlertCircle,
  Award,
  CheckCircle2,
  Download,
  ScrollText,
  TriangleAlert,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, StatCard } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Progress from "../components/ui/Progress";
import { attendanceTone } from "../lib/attendance";
import { SkeletonRow } from "../components/ui/Skeleton";
import { useStudentAttendance } from "../hooks/useStudentAttendance";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatTime, groupByDate } from "../lib/format";
import { LOW_ATTENDANCE_THRESHOLD } from "../lib/constants";

export default function StudentHistory() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  const { history, loading, error, setError } = useStudentAttendance(isStudent);

  // Count how many lectures the student attended in each subject.
  // The Map keeps one entry per subject name, and we add to its count.
  // Each entry looks like { subject, teacher, count }.
  const bySubject = new Map();

  for (const session of history) {
    const existing = bySubject.get(session.lectureName);

    if (existing) {
      existing.count += 1;
      continue;
    }

    bySubject.set(session.lectureName, {
      subject: session.lectureName,
      teacher: session.teacher?.name ?? "Faculty",
      count: 1,
    });
  }

  // Most attended subject first.
  const subjects = Array.from(bySubject.values()).sort((a, b) => b.count - a.count);

  // The server sends history newest first, so index 0 is the latest and the
  // last item is the very first lecture the student attended.
  const latest = history[0];
  const firstMarked = history[history.length - 1];

  // Each session carries the exact time the student marked it.
  const markedAt = (session) => {
    const entry = session.students.find((student) => student.studentId === user?.id);
    return entry?.submittedAt ?? session.date;
  };

  const exportCsv = () => {
    const header = [
      "Date",
      "Subject",
      "Course",
      "Class",
      "Section",
      "Teacher",
      "Marked at",
    ];
    const rows = history.map((session) => [
      formatDate(session.date),
      session.lectureName,
      session.course,
      session.class,
      session.section,
      session.teacher?.name ?? "Faculty",
      formatTime(markedAt(session)),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "attendeasy-my-attendance.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout contextLabel="My attendance">
      <PageHeader
        eyebrow="Records"
        title="My attendance"
        description="Every lecture you've been marked present for, newest first."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={exportCsv}
            disabled={history.length === 0}
            leadingIcon={<Download className="size-4" />}
          >
            Download
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
          label="Lectures attended"
          value={history.length}
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Subjects"
          value={subjects.length}
          hint="Across your course"
          icon={<ScrollText className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Most recent"
          value={latest ? formatDate(latest.date) : "—"}
          hint={latest ? latest.lectureName : "No records yet"}
          icon={<Award className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader
            title="Attendance log"
            description="Grouped by day, with the time you marked."
            icon={<ScrollText className="size-4" />}
          />

          <div className="mt-5">
            {loading ? (
              <div className="overflow-hidden rounded-xl border border-ink-200/80 dark:border-ink-800">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                icon={<ScrollText className="size-6" />}
                title="No records yet"
                description="Once you mark attendance for a lecture it will be listed here with the date and time."
              />
            ) : (
              <div className="space-y-5">
                {groupByDate(history).map((group) => (
                  <div key={group.key}>
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
                              {session.course} · {session.class} · Section{" "}
                              {session.section} · {session.teacher?.name ?? "Faculty"}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[12.5px] font-bold text-ink-900 dark:text-white">
                              {formatTime(markedAt(session))}
                            </p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              Present
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader
              title="Subject-wise record"
              description="Lectures attended in each subject."
              icon={<Award className="size-4" />}
            />

            <div className="mt-5 space-y-4">
              {subjects.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-[12.5px] text-ink-500 dark:border-ink-700 dark:text-ink-400">
                  Subject-wise records will appear as you attend lectures.
                </p>
              ) : (
                subjects.map((subject) => {
                  const share = Math.round((subject.count / history.length) * 100);
                  const tone = attendanceTone(share);

                  return (
                    <div key={subject.subject}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-bold text-ink-900 dark:text-white">
                            {subject.subject}
                          </p>
                          <p className="truncate text-[11.5px] text-ink-500 dark:text-ink-400">
                            {subject.teacher}
                          </p>
                        </div>
                        <span className="shrink-0 text-[12.5px] font-bold text-ink-700 tabular-nums dark:text-ink-200">
                          {subject.count} {subject.count === 1 ? "lecture" : "lectures"}
                        </span>
                      </div>
                      <Progress value={share} tone={tone} />
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {subjects.length > 0 && (
            <Card>
              <CardHeader
                title="Good to know"
                icon={<TriangleAlert className="size-4" />}
              />

              <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-ink-600 dark:text-ink-300">
                {subjects.some(
                  (subject) => subject.count < LOW_ATTENDANCE_THRESHOLD,
                ) ? (
                  <p>
                    Attend more lectures in your lighter subjects. Most institutions
                    expect at least {LOW_ATTENDANCE_THRESHOLD}% attendance to be
                    eligible for exams.
                  </p>
                ) : (
                  <p>
                    You are building a strong record. Keep marking attendance before
                    each session closes.
                  </p>
                )}

                {firstMarked && (
                  <p className="text-ink-500 dark:text-ink-400">
                    Your attendance record started on {formatDate(firstMarked.date)}.
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
