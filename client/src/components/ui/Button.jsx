import { Link } from "react-router-dom";
import Spinner from "./Spinner";

// `variant` decides the colours. Valid names:
// primary, secondary, ghost, danger, success.
// `size` decides the padding and font size. Valid names: sm, md, lg.

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.985] whitespace-nowrap";

const variants = {
  primary:
    "bg-brand-600 text-white shadow-soft hover:bg-brand-700 hover:shadow-elevated dark:bg-brand-500 dark:hover:bg-brand-400",
  secondary:
    "border border-ink-200 bg-white text-ink-800 shadow-soft hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-ink-800",
  ghost:
    "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white",
  danger:
    "border border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900/60 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-950/40",
  success:
    "border border-emerald-300 bg-emerald-500 text-white shadow-soft hover:bg-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500 dark:hover:bg-emerald-400",
};

const sizes = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

// Joins all the button styles into one className string.
function classes({ variant = "primary", size = "md", fullWidth, className = "" }) {
  return [base, variants[variant], sizes[size], fullWidth ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  loading = false,
  loadingLabel,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  ...rest
}) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={classes({ variant, size, fullWidth, className })}
    >
      {loading ? <Spinner className="size-4" /> : leadingIcon}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && trailingIcon}
    </button>
  );
}

export function ButtonLink({
  to,
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
}) {
  return (
    <Link to={to} className={classes({ variant, size, fullWidth, className })}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}

export function ButtonAnchor({
  href,
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
}) {
  return (
    <a href={href} className={classes({ variant, size, fullWidth, className })}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </a>
  );
}
