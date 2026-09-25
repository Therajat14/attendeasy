import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";
import type { AttendanceSession } from "../types/attendance";

const REFRESH_INTERVAL_MS = 8000;

export function useStudentAttendance(enabled: boolean) {
  const [liveSessions, setLiveSessions] = useState<AttendanceSession[]>([]);
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = useCallback(
    async (showSpinner = true) => {
      if (!enabled) return;

      if (showSpinner) setRefreshing(true);

      try {
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
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchAll(false);

    const interval = window.setInterval(() => {
      void fetchAll(false);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [enabled, fetchAll]);

  const live = useMemo(
    () =>
      liveSessions.filter(
        (session) => new Date(session.expiresAt).getTime() > Date.now(),
      ),
    [liveSessions],
  );

  return { live, history, loading, refreshing, error, setError, refresh: fetchAll };
}
