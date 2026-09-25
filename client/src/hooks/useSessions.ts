import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";
import type { AttendanceSession } from "../types/attendance";

const REFRESH_INTERVAL_MS = 10000;

interface UseSessionsOptions {
  enabled: boolean;
  poll?: boolean;
}

export function useSessions({ enabled, poll = true }: UseSessionsOptions) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const isFirstLoad = useRef(true);

  const fetchSessions = useCallback(
    async (showSpinner = true) => {
      if (!enabled) return;

      if (showSpinner && isFirstLoad.current) {
        setLoading(true);
      } else if (showSpinner) {
        setRefreshing(true);
      }

      try {
        const response = await api.get<AttendanceSession[]>("/attendance");
        setSessions(response.data);
        setError("");
      } catch (err) {
        setError(getErrorMessage(err, "We couldn't load your sessions."));
      } finally {
        isFirstLoad.current = false;
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

    void fetchSessions(true);

    if (!poll) return;

    const interval = window.setInterval(() => {
      void fetchSessions(false);
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [enabled, poll, fetchSessions]);

  return {
    sessions,
    setSessions,
    loading,
    refreshing,
    error,
    setError,
    refresh: fetchSessions,
  };
}
