import { Link } from "react-router-dom";

// `size` decides the wordmark size. Valid names: sm, md, lg.
const sizes = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
};

export default function Logo({ to = "/", size = "md", className = "" }) {
  const content = (
    <span className={`inline-flex items-center ${className}`}>
      <span
        className={`${sizes[size]} font-display font-extrabold tracking-tight text-ink-900 dark:text-white`}
      >
        Attend<span className="text-brand-600 dark:text-brand-400">Easy</span>
      </span>
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} aria-label="AttendEasy home" className="rounded-xl">
      {content}
    </Link>
  );
}
