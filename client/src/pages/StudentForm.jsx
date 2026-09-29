import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Sparkles,
  Users,
} from "lucide-react";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import { Button, ButtonLink } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Logo from "../components/ui/Logo";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";

export default function StudentForm() {
  const { token } = useParams();
  const { user, isLoading } = useAuth();
  const { notify } = useToast();

  const [error, setError] = useState("");
  const [marked, setMarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // While we are still asking the server who the visitor is, we show nothing,
  // so the page does not flash the "please sign in" message at someone who is
  // about to be recognised.
  if (isLoading) {
    return null;
  }

  // Students reach this page from the QR link, so they have to be signed in.
  // We remember the link so login can send them straight back here.
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `/form/${token}` }} />;
  }

  const isStudent = user.role === "student";

  const markPresent = async () => {
    setError("");
    setSubmitting(true);

    try {
      await api.post(`/attendance/mark/${token}`);
      setMarked(true);
      notify({
        title: "Attendance recorded",
        description: "Your teacher can see you on the list.",
        tone: "success",
      });
    } catch (markError) {
      const message = getErrorMessage(markError, "We couldn't record your attendance.");

      // The server says "Already marked" if the student taps twice, so we
      // show the success screen instead of an error.
      if (message.toLowerCase().includes("already")) {
        setMarked(true);
        notify({
          title: "Already marked",
          description: "You're on the list for this lecture.",
          tone: "info",
        });
        return;
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 dark:bg-ink-950">
      <header className="border-b border-ink-200/80 bg-white px-4 py-4 sm:px-6 dark:border-ink-800 dark:bg-ink-900/50">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
          <Logo />
          <Badge tone="neutral" icon={<BadgeCheck className="size-3" />}>
            Attendance link
          </Badge>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <Card className="text-center">
            <span
              className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
                marked
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
              }`}
            >
              {marked ? (
                <CheckCircle2 className="size-7" />
              ) : (
                <Sparkles className="size-7" />
              )}
            </span>

            <h1 className="mt-5 font-display text-[23px] font-extrabold text-ink-900 dark:text-white">
              {marked ? "You're marked" : "Mark your attendance"}
            </h1>

            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500 dark:text-ink-400">
              {marked
                ? "Your attendance for this lecture has been recorded. You can close this page."
                : `You're signed in as ${user.name}. One tap records your presence for this lecture.`}
            </p>

            {user.course && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Badge tone="neutral">
                  {user.course} · {user.class} · Section {user.section}
                </Badge>
                {user.rollNo && <Badge tone="neutral">Roll {user.rollNo}</Badge>}
              </div>
            )}

            <div className="mt-6 space-y-3 text-left">
              {!isStudent && (
                <Alert tone="warning" icon={<AlertCircle className="size-4" />}>
                  Only student accounts can mark attendance. Ask your teacher for help.
                </Alert>
              )}

              {error && (
                <Alert tone="danger" icon={<AlertCircle className="size-4" />}>
                  {error}
                </Alert>
              )}

              {marked && (
                <Alert tone="success" icon={<CheckCircle2 className="size-4" />}>
                  All done. Your teacher can see you on the attendance list.
                </Alert>
              )}

              <Button
                fullWidth
                size="lg"
                loading={submitting}
                loadingLabel="Recording"
                disabled={marked || !isStudent}
                onClick={markPresent}
                leadingIcon={
                  !submitting && !marked ? (
                    <CheckCircle2 className="size-4" />
                  ) : undefined
                }
              >
                {marked ? "Attendance recorded" : "Mark me present"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => window.history.back()}
              >
                Go back
              </Button>
            </div>
          </Card>

          <div className="mt-5 space-y-2.5 text-[12.5px] text-ink-500 dark:text-ink-400">
            <p className="flex items-center justify-center gap-2">
              <Clock3 className="size-3.5" />
              This link only works while the session is open.
            </p>
            <p className="flex items-center justify-center gap-2">
              <Users className="size-3.5" />
              Attendance is recorded against your student account.
            </p>
          </div>

          <div className="mt-6">
            <EmptyState
              compact
              icon={<Users className="size-5" />}
              title="Marking attendance for someone else?"
              description="Attendance can only be recorded from your own account. This helps keep records fair for everyone."
              action={
                <ButtonLink to="/student/dashboard" variant="secondary" size="sm">
                  Go to my dashboard
                </ButtonLink>
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
