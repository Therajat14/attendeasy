import { Link } from "react-router-dom";

interface LogoProps {
  to?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: "size-8", icon: "size-4", text: "text-base" },
  md: { box: "size-9", icon: "size-5", text: "text-lg" },
  lg: { box: "size-11", icon: "size-6", text: "text-xl" },
};

export default function Logo({
  to = "/",
  size = "md",
  showWordmark = true,
  className = "",
}: LogoProps) {
  const scale = sizes[size];

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`${scale.box} relative flex shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_16px_-6px_rgb(37_68_235/0.65)]`}
      >
        <svg
          viewBox="0 0 24 24"
          className={scale.icon}
          fill="none"
          stroke="white"
          strokeWidth="2.1"
        >
          <path
            d="M4 8.5V16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5"
            strokeLinecap="round"
          />
          <rect
            x="3"
            y="4"
            width="18"
            height="4.5"
            rx="1.6"
            fill="white"
            stroke="none"
          />
          <path
            d="m9.5 13.4 1.7 1.8 3.6-3.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {showWordmark && (
        <span
          className={`${scale.text} font-display font-extrabold tracking-tight text-ink-900 dark:text-white`}
        >
          Attend<span className="text-brand-600 dark:text-brand-400">Easy</span>
        </span>
      )}
    </span>
  );

  if (!to) return content;

  return (
    <Link to={to} aria-label="AttendEasy home" className="rounded-xl">
      {content}
    </Link>
  );
}
