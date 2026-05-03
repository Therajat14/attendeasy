import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface GenerateFormLinkResponse {
  formUrl: string;
  expiresAt: string;
}

function extractApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "Unable to generate form link";
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [formUrl, setFormUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [formLinkError, setFormLinkError] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleGenerateFormLink = async () => {
    setFormLinkError("");
    setGeneratingLink(true);

    try {
      const response = await api.post<GenerateFormLinkResponse>("/generate-form-link");
      setFormUrl(response.data.formUrl);
      setExpiresAt(response.data.expiresAt);
    } catch (error) {
      setFormLinkError(extractApiError(error));
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyFormLink = async () => {
    if (!formUrl) return;
    await navigator.clipboard.writeText(formUrl);
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <header className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
        <div className="rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
          <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Email: {user?.email}</p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">Role: {user?.role}</p>

          {user?.role === "teacher" && (
            <section className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <h3 className="text-lg font-semibold">Student public form</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                Generate a unique link students can use to submit their details to your account.
              </p>

              {formLinkError && (
                <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                  {formLinkError}
                </p>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGenerateFormLink}
                  disabled={generatingLink}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
                >
                  {generatingLink ? "Generating..." : "Generate form link"}
                </button>

                {formUrl && (
                  <button
                    type="button"
                    onClick={handleCopyFormLink}
                    className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
                  >
                    Copy link
                  </button>
                )}
              </div>

              {formUrl && (
                <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-black">
                  <p className="break-all font-medium">{formUrl}</p>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Expires: {new Date(expiresAt).toLocaleString()}
                  </p>
                </div>
              )}
            </section>
          )}

          <button
            onClick={handleLogout}
            className="mt-6 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}
