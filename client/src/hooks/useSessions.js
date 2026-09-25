import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import { getErrorMessage } from "../lib/errors";

// How often we re-check the server so a live roster updates by itself.
const POLL_INTERVAL_MS = 10000;

/**
 * Loads a teacher's attendance sessions and keeps them up to date.
 *
 * `isEnabled` is false for students, who are not allowed to see this list.
 */
export function useSessions(isEnabled) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // useCallback is used here for one reason only: it keeps this function's
  // identity stable, so the polling effect below does not tear down and
  // recreate its timer on every render.
  const load = useCallback(async (showSpinner) => {
    if (showSpinner) setRefreshing(true);

    try {
      const response = await api.get("/attendance");
      setSessions(response.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load your sessions."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load once when the page opens, then poll quietly in the background.
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

  return {
    sessions,
    setSessions,
    loading,
    refreshing,
    error,
    setError,
    // Used by the "Refresh" button, so it shows a spinner.
    refresh: () => load(true),
    // Used after an action already gave feedback, so it stays quiet.
    refreshSilently: () => load(false),
  };
}
