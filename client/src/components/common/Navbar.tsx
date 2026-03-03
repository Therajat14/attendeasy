import { Link } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-black">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link to="/" className="text-lg font-semibold tracking-tight">
          AttendEasy
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-white transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
