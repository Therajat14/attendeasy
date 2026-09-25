import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextField } from "./Field";

export default function PasswordField({ label = "Password", hint, error, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...rest}
      label={label}
      hint={hint}
      error={error}
      type={visible ? "text" : "password"}
      className="pr-11"
      trailingSlot={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}
