import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, GraduationCap, Mail, UserRound } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Alert from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { SelectField, TextField } from "../components/ui/Field";
import PasswordField from "../components/ui/PasswordField";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";
import { CLASSES, COURSES, ROLE_OPTIONS, SECTIONS } from "../lib/constants";
import type { User } from "../types/user";

const highlights = [
  "Set up your class in a couple of minutes",
  "Share one link per lecture, no installs",
  "A clean attendance record for every student",
];

type Role = "student" | "teacher" | "cr";

interface FormState {
  name: string;
  email: string;
  password: string;
  role: Role;
  rollNo: string;
  course: string;
  class: string;
  section: string;
}

const initialForm: FormState = {
  name: "",
  email: "",
  password: "",
  role: "student",
  rollNo: "",
  course: "",
  class: "",
  section: "",
};

export default function Signup() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isStudent = form.role === "student";

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (form.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Use at least 6 characters.";

    if (isStudent) {
      const rollNo = Number(form.rollNo);
      if (!Number.isInteger(rollNo) || rollNo < 1)
        next.rollNo = "Enter a valid roll number.";
      if (!form.course) next.course = "Select your course.";
      if (!form.class) next.class = "Select your year.";
      if (!form.section) next.section = "Select your section.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!validate()) return;

    setSubmitting(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role as User["role"],
        ...(isStudent
          ? {
              rollNo: Number(form.rollNo),
              course: form.course,
              class: form.class,
              section: form.section,
            }
          : {}),
      });

      notify({
        title: "Account created",
        description: "Your workspace is ready to use.",
        tone: "success",
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        getErrorMessage(err, "We couldn't create your account. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectRole = (role: Role) => {
    setForm((current) => ({ ...current, role }));
    setErrors({});
  };

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Start attending in minutes"
      subtitle="Tell us who you are and we'll set up the right workspace for you."
      highlights={highlights}
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <Alert tone="danger" icon={<AlertCircle className="size-4" />}>
            {error}
          </Alert>
        )}

        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-ink-800 dark:text-ink-200">
            I am joining as
          </legend>

          <div className="grid gap-2">
            {ROLE_OPTIONS.map((option) => {
              const selected = form.role === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectRole(option.value as Role)}
                  aria-pressed={selected}
                  className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                    selected
                      ? "border-brand-500 bg-brand-50/70 ring-4 ring-brand-500/10 dark:bg-brand-500/10"
                      : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-ink-600 dark:hover:bg-ink-800"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      selected
                        ? "border-brand-600"
                        : "border-ink-300 dark:border-ink-600"
                    }`}
                  >
                    {selected && (
                      <span className="size-2.5 rounded-full bg-brand-600" />
                    )}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-ink-900 dark:text-white">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500 dark:text-ink-400">
                      {option.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Your full name"
          leadingSlot={<UserRound className="size-4" />}
          value={form.name}
          error={errors.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          required
        />

        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          leadingSlot={<Mail className="size-4" />}
          value={form.email}
          error={errors.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />

        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="At least 6 characters"
          hint="Use something you don't use elsewhere."
          value={form.password}
          error={errors.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />

        {isStudent && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Course"
                placeholder="Select course"
                options={COURSES.map((course) => ({
                  value: course,
                  label: course,
                }))}
                value={form.course}
                error={errors.course}
                onChange={(event) => setForm({ ...form, course: event.target.value })}
                leadingSlot={<GraduationCap className="size-4" />}
                required
              />

              <TextField
                label="Roll number"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="e.g. 21"
                value={form.rollNo}
                error={errors.rollNo}
                onChange={(event) => setForm({ ...form, rollNo: event.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Year of study"
                placeholder="Select year"
                options={CLASSES.map((year) => ({ value: year, label: year }))}
                value={form.class}
                error={errors.class}
                onChange={(event) => setForm({ ...form, class: event.target.value })}
                required
              />

              <SelectField
                label="Section"
                placeholder="Select section"
                options={SECTIONS.map((section) => ({
                  value: section,
                  label: `Section ${section}`,
                }))}
                value={form.section}
                error={errors.section}
                onChange={(event) => setForm({ ...form, section: event.target.value })}
                required
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          loadingLabel="Creating your account"
        >
          Create account
        </Button>

        <p className="text-center text-[12px] leading-relaxed text-ink-400">
          By continuing you agree to use AttendEasy for your own attendance only.
        </p>
      </form>
    </AuthLayout>
  );
}
