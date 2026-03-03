import { motion } from "framer-motion";
import { Github } from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 transition-colors duration-300 dark:bg-black dark:text-white">
      <nav className="border-b border-neutral-200 px-4 py-4 sm:px-8 dark:border-neutral-800">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">AttendEasy</h1>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900 sm:inline-block"
            >
              Login
            </Link>

            <ThemeToggle />

            <a
              href="https://github.com/Therajat14/attendeasy"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-neutral-900 px-4 py-2 text-sm font-medium transition hover:bg-neutral-900 hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black sm:flex"
            >
              <Github size={16} />
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20 md:px-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold tracking-tight leading-tight sm:text-5xl"
        >
          Secure JWT Attendance Platform
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-6 text-sm text-neutral-600 dark:text-neutral-400 sm:text-base"
        >
          AttendEasy uses JWT authentication and role-based access to secure
          attendance workflows for colleges and institutions.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <Link
            to="/signup"
            className="inline-block rounded-xl bg-neutral-900 px-8 py-4 font-medium text-white transition hover:opacity-90 dark:bg-white dark:text-black"
          >
            Get Started
          </Link>
        </motion.div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-3 sm:px-6 md:px-10">
        {[
          "JWT Auth + Session Persistence",
          "Protected Dashboard Routes",
          "Role-aware Access Control",
          "QR Attendance Workflow",
          "Secure API Token Headers",
          "Black/White Theme System",
        ].map((feature, index) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="rounded-2xl border border-neutral-200 p-6 shadow-sm transition hover:shadow-md dark:border-neutral-800"
          >
            <h3 className="text-lg font-semibold">{feature}</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Production-ready foundation with stable auth and theming.
            </p>
          </motion.div>
        ))}
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500 dark:border-neutral-800">
        © {new Date().getFullYear()} AttendEasy
      </footer>
    </div>
  );
}
