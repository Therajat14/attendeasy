import { useState } from "react";
import { CalendarDays, Search, Users, X } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/common/PageHeader";
import Alert from "../components/ui/Alert";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardHeader, StatCard } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonRow } from "../components/ui/Skeleton";
import { useSessions } from "../hooks/useSessions";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatTime, groupByDate } from "../lib/format";

export default function TeacherSessions() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const { sessions, loading, refreshing, error, setError, refresh } =
    useSessions(isTeacher);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");

  // Search box: keep sessions where any of these words contains what was typed.
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? sessions.filter((session) =>
        [session.lectureName, session.course, session.class, session.section]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : sessions;

  // The session shown in the roster panel: the one clicked, or the first result.
  const selectedSession =
    sessions.find((session) => session.id === selectedId) ?? filtered[0] ?? null;

  const totalMarks = sessions.reduce((sum, session) => sum + session.studentCount, 0);
  const average = sessions.length ? Math.round(totalMarks / sessions.length) : 0;

  // Sessions grouped under Today / Yesterday / a date.
  const grouped = groupByDate(filtered);

  return (
    <DashboardLayout contextLabel="Attendance sessions">
      <PageHeader
        eyebrow="Records"
        title="Attendance sessions"
        description="Every session you've run, with the students who were present."
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
        <Alert tone="danger" className="mb-6" onDismiss={() => setError("")}>
          {error}
        </Alert>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total sessions"
          value={sessions.length}
          icon={<CalendarDays className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Total marks"
          value={totalMarks}
          icon={<Users className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Average per session"
          value={average}
          icon={<CalendarDays className="size-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader
            title="All sessions"
            description="Pick a session to see who attended."
            icon={<CalendarDays className="size-4" />}
          />

          <div className="relative mt-4 min-w-0">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by subject or class"
              aria-label="Search sessions"
              className="w-full min-w-0 rounded-xl border border-ink-200 bg-white py-2.5 pr-3.5 pl-10 text-sm shadow-soft transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none dark:border-ink-700 dark:bg-ink-900 dark:focus:border-brand-400"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="mt-4 space-y-5">
            {loading ? (
              <div className="overflow-hidden rounded-xl border border-ink-200/80 dark:border-ink-800">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : grouped.length === 0 ? (
              <EmptyState
                compact
                icon={<CalendarDays className="size-5" />}
                title={query ? "No matching sessions" : "No sessions yet"}
                description={
                  query
                    ? "Try a different subject, course or section."
                    : "Sessions you run will be listed here with full attendance detail."
                }
              />
            ) : (
              grouped.map((group) => (
                <div key={group.key}>
                  <p className="mb-2 text-[11.5px] font-bold tracking-wider text-ink-400 uppercase">
                    {group.label}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map((session) => (
                      <li key={session.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(session.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                            selectedId === session.id
                              ? "border-brand-400 bg-brand-50/60 dark:border-brand-500/50 dark:bg-brand-500/10"
                              : "border-ink-200/80 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-800 dark:hover:border-ink-700 dark:hover:bg-ink-800/50"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-bold text-ink-900 dark:text-white">
                              {session.lectureName}
                            </p>
                            <p className="mt-0.5 truncate text-[11.5px] text-ink-500 dark:text-ink-400">
                              {session.course} · {session.class} · Section{" "}
                              {session.section} · {formatTime(session.date)}
                            </p>
                          </div>
                          <Badge tone={session.isActive ? "success" : "neutral"}>
                            {session.studentCount}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          {selectedSession ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-extrabold text-ink-900 dark:text-white">
                    {selectedSession.lectureName}
                  </h2>
                  <p className="mt-1 text-[13px] text-ink-500 dark:text-ink-400">
                    {selectedSession.course} · {selectedSession.class} · Section{" "}
                    {selectedSession.section}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    {formatDate(selectedSession.date)}
                  </p>
                </div>
                <Badge tone="success" icon={<Users className="size-3" />}>
                  {selectedSession.studentCount} present
                </Badge>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-ink-200/80 dark:border-ink-800">
                {selectedSession.students.length === 0 ? (
                  <p className="px-4 py-6 text-center text-[12.5px] text-ink-500 dark:text-ink-400">
                    No students were marked present in this session.
                  </p>
                ) : (
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-ink-50 text-[11px] font-bold tracking-wider text-ink-500 uppercase dark:bg-ink-800/60 dark:text-ink-400">
                      <tr>
                        <th className="px-4 py-3">Roll</th>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3 text-right">Marked at</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSession.students.map((student) => (
                        <tr
                          key={`${selectedSession.id}-${student.studentId}`}
                          className="border-t border-ink-100 dark:border-ink-800"
                        >
                          <td className="px-4 py-3 font-semibold text-ink-500 tabular-nums dark:text-ink-400">
                            {student.rollNo ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={student.name} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-ink-900 dark:text-white">
                                  {student.name}
                                </p>
                                <p className="truncate text-[11.5px] text-ink-500 dark:text-ink-400">
                                  {student.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-ink-500 tabular-nums dark:text-ink-400">
                            {formatTime(student.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<CalendarDays className="size-6" />}
              title="Select a session"
              description="Choose any session from the list to review who was present."
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
