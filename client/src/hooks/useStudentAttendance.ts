import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";
import type { AttendanceSession } from "../types/attendance";

// How often we re-check the server so new live lectures appear by themselves.
const POLL_INTERVAL_MS = 8000;

/**
 * Loads the two lists a student needs: the lectures that are live right now,
 * and the lectures they have already attended.
 *
 * `isEnabled` is false for teachers and class reps.
 */
export function useStudentAttendance(isEnabled: boolean) {
  const [liveSessions, setLiveSessions] = useState<AttendanceSession[]>([]);
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // useCallback keeps this function's identity stable so the polling effect
  // below does not restart its timer on every render.
  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setRefreshing(true);

    try {
      // Both requests go out at the same time instead of waiting in turn.
      const [liveResponse, historyResponse] = await Promise.all([
        api.get<AttendanceSession[]>("/attendance/live"),
        api.get<AttendanceSession[]>("/attendance/student/history"),
      ]);

      setLiveSessions(liveResponse.data);
      setHistory(historyResponse.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load your attendance."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      setLoading(false);
      return;
    }

    load(false);

    const timer = window.setInterval(() => {
      load(false);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isEnabled, load]);

  // A session can still say isActive while its 30 minutes are already up, so
  // we hide anything whose expiry time has passed.
  const live = liveSessions.filter(
    (session) => new Date(session.expiresAt).getTime() > Date.now(),
  );

  return {
    live,
    history,
    loading,
    refreshing,
    error,
    setError,
    // Used by the "Check again" button, so it shows a spinner.
    refresh: () => load(true),
    // Used right after marking, so it stays quiet.
    refreshSilently: () => load(false),
  };
}
