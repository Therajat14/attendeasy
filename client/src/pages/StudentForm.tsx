import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import type { AxiosError } from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../services/api";

interface StudentFormState {
  name: string;
  class: string;
  section: string;
  rollNo: string;
}

function extractApiError(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || "Unable to submit student details";
}

export default function StudentForm() {
  const { token } = useParams();
  const [form, setForm] = useState<StudentFormState>({
    name: "",
    class: "",
    section: "",
    rollNo: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await api.post(`/submit-form/${token}`, {
        ...form,
        rollNo: Number(form.rollNo),
      });
      setSuccess("Your details were submitted successfully.");
      setForm({ name: "", class: "", section: "", rollNo: "" });
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white">
      <header className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            AttendEasy
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-4xl items-center px-4 py-8 sm:px-8">
        <section className="w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-black sm:p-8">
          <p className="inline-block rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium dark:border-neutral-700">
            Student details
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Submit your attendance profile</h1>
          <p className="mt-3 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
            Fill this once using the link shared by your teacher. Your details will be attached to
            that teacher&apos;s account.
          </p>

          {error && (
            <p className="mt-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-5 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="class" className="mb-1 block text-sm font-medium">
                Class
              </label>
              <input
                id="class"
                required
                value={form.class}
                onChange={(e) => setForm({ ...form, class: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                placeholder="BCA 2nd Year"
              />
            </div>

            <div>
              <label htmlFor="section" className="mb-1 block text-sm font-medium">
                Section
              </label>
              <input
                id="section"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                placeholder="A"
              />
            </div>

            <div>
              <label htmlFor="rollNo" className="mb-1 block text-sm font-medium">
                Roll number
              </label>
              <input
                id="rollNo"
                required
                min="1"
                type="number"
                value={form.rollNo}
                onChange={(e) => setForm({ ...form, rollNo: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-black dark:focus:border-white dark:focus:ring-neutral-700"
                placeholder="23"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-black"
              >
                {submitting ? "Submitting..." : "Submit details"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
