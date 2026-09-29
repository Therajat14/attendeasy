import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Check, GraduationCap, Mail, UserRound } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Alert from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { SelectField, TextField } from "../components/ui/Field";
import PasswordField from "../components/ui/PasswordField";
import Progress from "../components/ui/Progress";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";
import { CLASSES, COURSES, ROLE_OPTIONS, SECTIONS } from "../lib/constants";

const highlights = [
  "Set up your class in a couple of minutes",
  "Share one link per lecture, no installs",
  "A clean attendance record for every student",
];

// Every field in the signup form. They all start empty, except the role,
// which starts on "student". Roll number stays a string while the user types
// and only becomes a Number when we send it to the API.
const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "student",
  rollNo: "",
  course: "",
  class: "",
  section: "",
};

// Registration runs as steps so only a few fields are on screen at a time and
// the page never has to scroll. Teachers skip the last step because they have
// no student details to fill.
function buildSteps(isStudent) {
  const steps = [
    { key: "role", title: "Role" },
    { key: "account", title: "Account" },
  ];

  if (isStudent) steps.push({ key: "student", title: "Student details" });

  return steps;
}

export default function Signup() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  // `errors` is an object like { email: "Enter a valid email address." }.
  // It stays empty when everything is fine.
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Which step we are on, counting from 0.
  const [step, setStep] = useState(0);

  const isStudent = form.role === "student";
  const steps = buildSteps(isStudent);
  const isLastStep = step === steps.length - 1;

  // Checks only the fields that belong to one step and returns the problems it
  // found. An empty object means the step is fine and we can move on.
  const validateStep = (key) => {
    const next = {};

    // Step 2: the details every account needs.
    if (key === "account") {
      if (form.name.trim().length < 2) {
        next.name = "Please enter your full name.";
      }

      // A rough email check: something, then @, then a domain with a dot in it.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) {
        next.email = "Enter a valid email address.";
      }

      if (form.password.length < 6) {
        next.password = "Use at least 6 characters.";
      }
    }

    // Step 3: the class details only a student has.
    if (key === "student") {
      const rollNo = Number(form.rollNo);

      if (!Number.isInteger(rollNo) || rollNo < 1) {
        next.rollNo = "Enter a valid roll number.";
      }

      if (!form.course) {
        next.course = "Select your course.";
      }

      if (!form.class) {
        next.class = "Select your year.";
      }

      if (!form.section) {
        next.section = "Select your section.";
      }
    }

    return next;
  };

  // Checks every step, so nothing wrong can slip through on the last one.
  const validateAll = () => {
    const next = {};

    for (const { key } of steps) {
      // Each step checks its own fields, so we copy its problems into the one
      // object we hand back.
      Object.assign(next, validateStep(key));
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Moves to the next step, but only when the current one is filled correctly.
  const goNext = () => {
    const next = validateStep(steps[step].key);
    setErrors(next);

    if (Object.keys(next).length > 0) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Any step that is not the last one behaves like a "Next" button.
    if (!isLastStep) {
      goNext();
      return;
    }

    // Something is wrong, so do not send anything to the server.
    if (!validateAll()) {
      return;
    }

    setSubmitting(true);

    // Build what we send. A student also sends their class details, while a
    // teacher or class rep has none, so those fields are simply left out.
    const account = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    };

    if (isStudent) {
      account.rollNo = Number(form.rollNo);
      account.course = form.course;
      account.class = form.class;
      account.section = form.section;
    }

    try {
      await register(account);

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

  // Picking a role changes how many steps there are, so we always go back to
  // the first step where the role is chosen.
  const selectRole = (role) => {
    setForm((current) => ({ ...current, role }));
    setErrors({});
    setStep(0);
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
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <Alert tone="danger" icon={<AlertCircle className="size-4" />}>
            {error}
          </Alert>
        )}

        <div>
          <div className="flex items-baseline justify-between">
            <p className="text-[12.5px] font-semibold text-ink-600 dark:text-ink-300">
              Step {step + 1} of {steps.length}
            </p>
            <p className="text-[12.5px] text-ink-500 dark:text-ink-400">
              {steps[step].title}
            </p>
          </div>

          <Progress className="mt-2" value={(step / (steps.length - 1)) * 100} />

          <ol className="mt-3 flex items-center gap-2">
            {steps.map((item, index) => {
              const done = index < step;
              const current = index === step;

              return (
                <li key={item.key} className="flex flex-1 items-center gap-2">
                  <span
                    aria-current={current ? "step" : undefined}
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${
                      done
                        ? "bg-brand-600 text-white"
                        : current
                          ? "bg-brand-50 text-brand-700 ring-2 ring-brand-500 dark:bg-brand-500/15 dark:text-brand-300"
                          : "bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : index + 1}
                  </span>
                  <span
                    className={`hidden text-[12.5px] font-semibold sm:block ${
                      current
                        ? "text-ink-900 dark:text-white"
                        : "text-ink-500 dark:text-ink-400"
                    }`}
                  >
                    {item.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {steps[step].key === "role" && (
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
                    onClick={() => selectRole(option.value)}
                    aria-pressed={selected}
                    className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                      selected
                        ? "border-brand-500 bg-brand-50/70 ring-4 ring-brand-500/10 dark:bg-brand-500/10"
                        : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:hover:border-ink-600 dark:hover:bg-ink-800"
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
        )}

        {steps[step].key === "account" && (
          <>
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
          </>
        )}

        {steps[step].key === "student" && (
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

        <div className="flex gap-3">
          {step > 0 && (
            <Button type="button" variant="ghost" onClick={goBack}>
              Back
            </Button>
          )}

          <Button
            type="submit"
            className="flex-1"
            loading={submitting}
            loadingLabel="Creating your account"
          >
            {isLastStep ? "Create account" : "Continue"}
          </Button>
        </div>

        {isLastStep && (
          <p className="text-center text-[12px] leading-relaxed text-ink-400">
            By continuing you agree to use AttendEasy for your own attendance only.
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
