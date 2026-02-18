import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-neutral-900 dark:text-white transition-colors duration-500">
      <div className="text-center max-w-md px-6">
        <h1 className="text-7xl font-bold tracking-tight">404</h1>

        <p className="mt-4 text-lg font-medium">Page not found</p>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-900 transition"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <p className="mt-10 text-xs text-neutral-500">
          AttendEasy — Smart Attendance Platform
        </p>
      </div>
    </div>
  );
}
