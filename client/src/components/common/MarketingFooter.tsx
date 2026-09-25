import { Link } from "react-router-dom";
import Logo from "../ui/Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Features", href: "#features" },
      { label: "For institutions", href: "#institutions" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create an account", to: "/signup" },
      { label: "Sign in", to: "/login" },
    ],
  },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50/60 dark:border-ink-800 dark:bg-ink-900/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-ink-500 dark:text-ink-400">
              Attendance that takes seconds. Run a live session, share one code, and
              everyone in the room is marked in real time.
            </p>
            <p className="mt-5 text-[12.5px] font-medium text-ink-400">
              Built for classrooms, coaching centres and training rooms.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-[12px] font-bold tracking-wide text-ink-900 uppercase dark:text-white">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"to" in link ? (
                      <Link
                        to={link.to}
                        className="text-[13.5px] text-ink-500 transition hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-[13.5px] text-ink-500 transition hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-ink-200 pt-6 sm:flex-row sm:items-center dark:border-ink-800">
          <p className="text-[12.5px] text-ink-500 dark:text-ink-400">
            © {new Date().getFullYear()} AttendEasy. All rights reserved.
          </p>
          <p className="text-[12.5px] text-ink-400">attendeasy.in</p>
        </div>
      </div>
    </footer>
  );
}
