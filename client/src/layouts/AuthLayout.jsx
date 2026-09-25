import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Logo from "../components/ui/Logo";
import ThemeToggle from "../components/ThemeToggle";

// `highlights` is the list of tick points on the left panel, and `footer` is
// the small line under the form, such as "Already have an account?".
export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  highlights,
}) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-ink-950">
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden bg-ink-950 lg:block">
        <div className="pointer-events-none absolute -top-32 -left-20 size-[26rem] rounded-full bg-brand-500/25 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-80 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo className="[&_span]:text-white" />

          <div className="max-w-md">
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[32px] leading-tight font-extrabold text-white xl:text-[38px]"
            >
              Attendance your whole college can trust.
            </motion.h2>

            <p className="mt-5 text-[14.5px] leading-relaxed text-ink-300">
              One shared code per lecture. Students mark in seconds, teachers see the
              class in real time, and every record is stored for you.
            </p>

            <ul className="mt-9 space-y-3.5">
              {highlights.map((highlight, index) => (
                <motion.li
                  key={highlight}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.15 + index * 0.08 }}
                  className="flex items-start gap-3 text-[14px] text-ink-200"
                >
                  <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-emerald-400" />
                  {highlight}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex -space-x-2">
              {["Data Structures", "DBMS", "Operating Systems"].map((subject) => (
                <span
                  key={subject}
                  className="flex size-8 items-center justify-center rounded-full border border-ink-950 bg-ink-800 text-[10px] font-bold text-ink-200"
                >
                  {subject.slice(0, 2).toUpperCase()}
                </span>
              ))}
            </div>
            <p className="text-[12.5px] text-ink-300">
              Used across classrooms, coaching centres and training rooms.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-ink-500 transition hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
          <div className="hidden lg:block" />
        </header>

        <div className="flex flex-1 items-start justify-center px-5 pt-4 pb-10 sm:px-8 lg:items-center lg:pt-0">
          <div className="w-full max-w-[26rem]">
            <p className="text-[11.5px] font-bold tracking-wider text-brand-600 uppercase dark:text-brand-400">
              {eyebrow}
            </p>
            <h1 className="mt-2.5 font-display text-[26px] font-extrabold text-ink-900 sm:text-[30px] dark:text-white">
              {title}
            </h1>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-500 dark:text-ink-400">
              {subtitle}
            </p>

            <div className="mt-8">{children}</div>

            <div className="mt-7 text-center text-[13.5px] text-ink-500 dark:text-ink-400">
              {footer}
            </div>
          </div>
        </div>

        <div className="flex justify-end px-5 pb-5 sm:px-8">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
