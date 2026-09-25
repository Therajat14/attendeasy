import { motion } from "framer-motion";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { ButtonLink } from "../components/ui/Button";
import Logo from "../components/ui/Logo";
import ThemeToggle from "../components/ThemeToggle";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white dark:bg-ink-950">
      <div className="surface-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-gradient-to-b from-brand-50/70 to-transparent dark:from-brand-500/10" />

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-lg text-center">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
          >
            <Compass className="size-8" />
          </motion.span>

          <p className="mt-8 text-[11.5px] font-bold tracking-wider text-brand-600 uppercase dark:text-brand-400">
            Error 404
          </p>

          <h1 className="mt-3 font-display text-[32px] leading-tight font-extrabold text-ink-900 sm:text-[40px] dark:text-white">
            This page isn't here
          </h1>

          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-ink-500 dark:text-ink-400">
            The page you're looking for may have moved, or the link might be incomplete.
            Let's get you back somewhere useful.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink to="/" size="lg" leadingIcon={<Home className="size-4" />}>
              Go to homepage
            </ButtonLink>
            <ButtonLink
              to="/dashboard"
              variant="secondary"
              size="lg"
              leadingIcon={<ArrowLeft className="size-4" />}
            >
              Open my dashboard
            </ButtonLink>
          </div>
        </div>
      </main>
    </div>
  );
}
