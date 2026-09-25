import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Mail } from "lucide-react";
import AuthLayout from "../layouts/AuthLayout";
import Alert from "../components/ui/Alert";
import { Button, ButtonLink } from "../components/ui/Button";
import { TextField } from "../components/ui/Field";
import PasswordField from "../components/ui/PasswordField";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/errors";

const highlights = [
  "Mark a full class in under a minute",
  "Watch the roster fill in as students mark",
  "Every record stored, ready to review",
];

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // If a guard sent us here, it left the page we wanted in location.state.
  const redirectTo = location.state?.from || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(form);
      notify({
        title: "Welcome back",
        description: "You're signed in.",
        tone: "success",
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't sign you in. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Sign in to mark attendance and see your classes."
      highlights={highlights}
      footer={
        <>
          New to AttendEasy?{" "}
          <Link
            to="/signup"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Create an account
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

        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          leadingSlot={<Mail className="size-4" />}
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />

        <PasswordField
          autoComplete="current-password"
          placeholder="Enter your password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          required
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          loadingLabel="Signing you in"
        >
          Sign in
        </Button>

        <ButtonLink to="/" variant="ghost" size="sm" fullWidth className="lg:hidden">
          Back to home
        </ButtonLink>
      </form>
    </AuthLayout>
  );
}
